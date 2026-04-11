import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from schemas import (
    AuthResponse,
    ExportEventRequest,
    ExportLifecycleEvent,
    PersistedSession,
    ProfileUpdateRequest,
    ResearchRequest,
    ResearchResponse,
    SessionResponse,
    SignupRequest,
    SignupResponse,
    UserProfile,
)
from services.auth_service import authenticate, create_token, get_user_profile, logout_token, read_users, register_session, save_user, upsert_user_profile, verify_user_credentials
from services.graph import graph
from services.logging_service import log_auth_event, log_error, log_research_event, log_session_event
from services.research_service import STEP_LOGS, normalize_agent_state, normalize_export_event, normalize_persisted_session
from services.storage_service import EXPORT_EVENTS_FILE, RESEARCH_SESSIONS_FILE, current_timestamp, read_json_store, write_json_store


router = APIRouter()


def _to_http_error(error: ValueError) -> HTTPException:
    message = str(error)
    status_code = 401 if "auth" in message.lower() or "session" in message.lower() else 400
    return HTTPException(status_code=status_code, detail=message)


def _authorize(authorization: Optional[str], token: Optional[str] = None) -> str:
    try:
        return authenticate(authorization, token)
    except ValueError as error:
        raise _to_http_error(error) from error


@router.post("/run_research_agent", response_model=ResearchResponse)
def run_research_agent(request: ResearchRequest, authorization: Optional[str] = Header(default=None)):
    try:
        username = _authorize(authorization)
        query = request.query
        log_research_event("start", username, query)
        
        result = graph.invoke(
            {
                "user_query": query,
                "subqueries": [],
                "raw_data": [],
                "final_output": "",
                "review_decision": "FAIL",
                "review_feedback": "",
                "revision_count": 0,
            }
        )
        
        log_research_event("complete", username, query, True, {"output_length": len(str(result.get("final_output", "")))})
        return {"result": normalize_agent_state(query, result)}
    except Exception as exc:
        if "username" in locals():
            log_research_event("error", username, request.query, False, {"error": str(exc)})
        else:
            log_error("research", str(exc))
        raise


@router.get("/run_research_agent/stream")
def run_research_agent_stream(
    query: str,
    authorization: Optional[str] = Header(default=None),
):
    username = _authorize(authorization)
    log_research_event("stream_start", username, query)

    def event_generator():
        state: Dict[str, Any] = {
            "user_query": query,
            "subqueries": [],
            "raw_data": [],
            "final_output": "",
            "review_decision": "FAIL",
            "review_feedback": "",
            "revision_count": 0,
        }

        try:
            for event in graph.stream(state, stream_mode="updates"):
                for node_name, update in event.items():
                    for log_line in STEP_LOGS.get(node_name, []):
                        yield f"data: {json.dumps({'type': 'log', 'line': log_line})}\n\n"

                    if isinstance(update, dict):
                        state.update(update)

            log_research_event("stream_complete", username, query, True)
            yield f"data: {json.dumps({'type': 'complete', 'agentState': normalize_agent_state(query, state)})}\n\n"
        except Exception as exc:
            log_research_event("stream_error", username, query, False, {"error": str(exc)})
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/signup", response_model=AuthResponse)
def signup(request: SignupRequest):
    username = (request.email or request.username).strip().lower()
    password = request.password

    try:
        users = read_users()
        if username in users:
            log_auth_event("signup", username, False, {"reason": "user_exists"})
            raise HTTPException(status_code=400, detail="User already exists")

        save_user(username, password)
        profile = upsert_user_profile(
            username,
            {
                "email": request.email or username,
                "display_name": request.display_name or username,
                "created_at": current_timestamp(),
            },
        )

        token_data = create_token(username)
        register_session(token_data["token"], username, token_data["exp"])

        log_auth_event("signup", username, True, {"email": request.email or username})

        return {
            "message": f"User {username} signed up successfully!",
            "token": token_data["token"],
            "token_type": "bearer",
            "expires_in": 60 * 60 * 24,
            "user": profile,
        }
    except HTTPException:
        raise
    except Exception as exc:
        log_error("signup", str(exc), username)
        raise HTTPException(status_code=500, detail="Signup failed") from exc


@router.post("/login", response_model=AuthResponse)
def login(request: SignupRequest):
    username = (request.email or request.username).strip().lower()
    password = request.password

    try:
        if not verify_user_credentials(username, password):
            log_auth_event("login", username, False, {"reason": "invalid_credentials"})
            raise HTTPException(status_code=401, detail="Invalid username or password")

        token_data = create_token(username)
        register_session(token_data["token"], username, token_data["exp"])

        log_auth_event("login", username, True)

        return {
            "message": f"User {username} logged in successfully!",
            "token": token_data["token"],
            "token_type": "bearer",
            "expires_in": 60 * 60 * 24,
            "user": get_user_profile(username),
        }
    except HTTPException:
        raise
    except Exception as exc:
        log_error("login", str(exc), username)
        raise HTTPException(status_code=500, detail="Login failed") from exc


@router.get("/session", response_model=SessionResponse)
def validate_session(authorization: Optional[str] = Header(default=None)):
    try:
        username = _authorize(authorization)
        log_session_event("validate", username)
        return {"authenticated": True, "username": username, "user": get_user_profile(username)}
    except Exception as exc:
        log_error("session_validate", str(exc))
        raise


@router.get("/profile", response_model=UserProfile)
def get_profile(authorization: Optional[str] = Header(default=None)):
    try:
        username = _authorize(authorization)
        return get_user_profile(username)
    except Exception as exc:
        log_error("profile_get", str(exc))
        raise


@router.patch("/profile", response_model=UserProfile)
def update_profile(request: ProfileUpdateRequest, authorization: Optional[str] = Header(default=None)):
    try:
        username = _authorize(authorization)
        current = get_user_profile(username)
        updated = {
            **current,
            "display_name": request.display_name or current.get("display_name", username),
        }
        result = upsert_user_profile(username, updated)
        log_session_event("profile_update", username, details={"display_name_updated": request.display_name is not None})
        return result
    except Exception as exc:
        log_error("profile_update", str(exc), username if "username" in locals() else None)
        raise


@router.post("/logout", response_model=SignupResponse)
def logout(authorization: Optional[str] = Header(default=None)):
    try:
        username = _authorize(authorization)
        logout_token(authorization)
        log_session_event("logout", username)
        return {"message": "Logged out successfully"}
    except ValueError as error:
        log_error("logout", str(error))
        raise _to_http_error(error) from error
    except Exception as exc:
        log_error("logout", str(exc))
        raise


@router.get("/research_sessions", response_model=List[PersistedSession])
def list_research_sessions(authorization: Optional[str] = Header(default=None)):
    username = _authorize(authorization)
    store = read_json_store(RESEARCH_SESSIONS_FILE)
    sessions = store.get(username, [])
    return [normalize_persisted_session(session) for session in sessions]


@router.post("/research_sessions", response_model=PersistedSession)
def save_research_session(session: PersistedSession, authorization: Optional[str] = Header(default=None)):
    username = _authorize(authorization)
    store = read_json_store(RESEARCH_SESSIONS_FILE)
    user_sessions = store.get(username, [])
    normalized = normalize_persisted_session(session.model_dump())

    existing_index = next((index for index, item in enumerate(user_sessions) if item.get("id") == normalized["id"]), None)
    if existing_index is not None:
        user_sessions[existing_index] = normalized
    else:
        user_sessions.insert(0, normalized)

    store[username] = user_sessions
    write_json_store(RESEARCH_SESSIONS_FILE, store)
    return normalized


@router.get("/export_events", response_model=List[ExportLifecycleEvent])
def list_export_events(authorization: Optional[str] = Header(default=None)):
    username = _authorize(authorization)
    store = read_json_store(EXPORT_EVENTS_FILE)
    events = store.get(username, [])
    return [normalize_export_event(username, event) for event in events]


@router.post("/export_events", response_model=ExportLifecycleEvent)
def create_export_event(event: ExportEventRequest, authorization: Optional[str] = Header(default=None)):
    username = _authorize(authorization)
    store = read_json_store(EXPORT_EVENTS_FILE)
    user_events = store.get(username, [])
    normalized = normalize_export_event(username, event.model_dump())
    user_events.insert(0, normalized)
    store[username] = user_events[:500]
    write_json_store(EXPORT_EVENTS_FILE, store)
    return normalized
