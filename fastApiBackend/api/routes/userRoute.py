import json
import os
import time
import hmac
import base64
import hashlib
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.graph import graph


class ResearchResponse(BaseModel):
    result: "AgentStateResponse"


class ResearchRequest(BaseModel):
    query: str


class SignupRequest(BaseModel):
    username: str
    password: str


class SignupResponse(BaseModel):
    message: str


class AuthResponse(BaseModel):
    message: str
    token: str
    token_type: str = "bearer"
    expires_in: int


class SessionResponse(BaseModel):
    authenticated: bool
    username: str


class AgentStateResponse(BaseModel):
    user_query: str
    subqueries: List[str]
    raw_data: List[str]
    final_output: str
    review_decision: str
    review_feedback: str
    revision_count: int


STEP_LOGS = {
    "subQueryAgentNode": [
        "--- PLANNER AGENT RUNNING ---",
        "Breaking query into sub-queries...",
    ],
    "fetchRawDataAgentNode": [
        "--- RESEARCHER AGENT RUNNING ---",
        "Fetching evidence from sources...",
    ],
    "writerAgentNode": [
        "--- WRITER AGENT RUNNING ---",
        "Synthesizing final report...",
    ],
    "review_agentNode": [
        "--- REVIEWER AGENT RUNNING ---",
        "Preparing final response...",
    ],
}

USERS_FILE = "users.txt"
AUTH_SECRET = os.getenv("AUTH_SECRET", "dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def _sse_event(payload: Dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def _sign(data: str) -> str:
    digest = hmac.new(AUTH_SECRET.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
    return _b64url(digest)


def _create_token(username: str) -> Dict[str, Any]:
    exp = int(time.time()) + TOKEN_TTL_SECONDS
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    payload = _b64url(json.dumps({"sub": username, "exp": exp}, separators=(",", ":")).encode("utf-8"))
    body = f"{header}.{payload}"
    signature = _sign(body)
    token = f"{body}.{signature}"
    return {"token": token, "exp": exp}


def _verify_token(token: str) -> Optional[Dict[str, Any]]:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    body = f"{parts[0]}.{parts[1]}"
    expected_sig = _sign(body)
    if not hmac.compare_digest(parts[2], expected_sig):
        return None

    try:
        payload = json.loads(_b64url_decode(parts[1]).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        return None

    return payload


def _read_users() -> Dict[str, str]:
    if not os.path.exists(USERS_FILE):
        return {}

    users: Dict[str, str] = {}
    with open(USERS_FILE, "r") as f:
        for line in f:
            if ":" not in line:
                continue
            username, password = line.strip().split(":", 1)
            users[username] = password
    return users


def _save_user(username: str, password: str) -> None:
    with open(USERS_FILE, "a") as f:
        f.write(f"{username}:{password}\n")


def _extract_bearer_token(authorization: Optional[str], token_query: Optional[str] = None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            return token

    if token_query:
        return token_query

    raise HTTPException(status_code=401, detail="Missing auth token")


def _register_session(token: str, username: str, exp: int) -> None:
    ACTIVE_SESSIONS[token] = {"username": username, "exp": exp}


def _authenticate(authorization: Optional[str], token_query: Optional[str] = None) -> str:
    token = _extract_bearer_token(authorization, token_query)
    payload = _verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired auth token")

    session = ACTIVE_SESSIONS.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")

    if not isinstance(session.get("exp"), int) or session["exp"] < int(time.time()):
        ACTIVE_SESSIONS.pop(token, None)
        raise HTTPException(status_code=401, detail="Session expired")

    username = payload.get("sub")
    if not isinstance(username, str) or username != session.get("username"):
        raise HTTPException(status_code=401, detail="Invalid session")

    return username


def _normalize_agent_state(query: str, payload: Any) -> Dict[str, Any]:
    source = payload if isinstance(payload, dict) else {}

    subqueries = source.get("subqueries", [])
    raw_data = source.get("raw_data", [])

    normalized = {
        "user_query": source.get("user_query") if isinstance(source.get("user_query"), str) else query,
        "subqueries": [item for item in subqueries if isinstance(item, str)] if isinstance(subqueries, list) else [],
        "raw_data": [item for item in raw_data if isinstance(item, str)] if isinstance(raw_data, list) else [],
        "final_output": source.get("final_output") if isinstance(source.get("final_output"), str) else "",
        "review_decision": source.get("review_decision") if isinstance(source.get("review_decision"), str) else "FAIL",
        "review_feedback": source.get("review_feedback") if isinstance(source.get("review_feedback"), str) else "",
        "revision_count": source.get("revision_count") if isinstance(source.get("revision_count"), int) else 0,
    }

    return AgentStateResponse(**normalized).model_dump()


router = APIRouter()


@router.post("/run_research_agent", response_model=ResearchResponse)
def run_research_agent(request: ResearchRequest, authorization: Optional[str] = Header(default=None)):
    _authenticate(authorization)
    query = request.query
    result = graph.invoke({
        "user_query": query,
        "subqueries": [],
        "raw_data": [],
        "final_output": "",
        "review_decision": "FAIL",
        "review_feedback": "",
        "revision_count": 0,
    })

    normalized_result = _normalize_agent_state(query, result)

    return {
        "result": normalized_result
    }


@router.get("/run_research_agent/stream")
def run_research_agent_stream(
    query: str,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = Query(default=None),
):
    _authenticate(authorization, token)

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
                        yield _sse_event({"type": "log", "line": log_line})

                    if isinstance(update, dict):
                        state.update(update)

            yield _sse_event({"type": "complete", "agentState": _normalize_agent_state(query, state)})
        except Exception as exc:
            yield _sse_event({"type": "error", "message": str(exc)})

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
    username = request.username
    password = request.password

    users = _read_users()
    if username in users:
        raise HTTPException(status_code=400, detail="User already exists")

    _save_user(username, password)

    token_data = _create_token(username)
    _register_session(token_data["token"], username, token_data["exp"])

    return {
        "message": f"User {username} signed up successfully!",
        "token": token_data["token"],
        "token_type": "bearer",
        "expires_in": TOKEN_TTL_SECONDS,
    }


@router.post("/login", response_model=AuthResponse)
def login(request: SignupRequest):
    username = request.username
    password = request.password

    users = _read_users()
    if users.get(username) != password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token_data = _create_token(username)
    _register_session(token_data["token"], username, token_data["exp"])

    return {
        "message": f"User {username} logged in successfully!",
        "token": token_data["token"],
        "token_type": "bearer",
        "expires_in": TOKEN_TTL_SECONDS,
    }


@router.get("/session", response_model=SessionResponse)
def validate_session(
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = Query(default=None),
):
    username = _authenticate(authorization, token)
    return {
        "authenticated": True,
        "username": username,
    }


@router.post("/logout", response_model=SignupResponse)
def logout(
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = Query(default=None),
):
    auth_token = _extract_bearer_token(authorization, token)
    ACTIVE_SESSIONS.pop(auth_token, None)
    return {"message": "Logged out successfully"}