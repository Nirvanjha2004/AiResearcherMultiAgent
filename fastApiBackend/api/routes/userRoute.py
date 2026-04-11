import json
from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.graph import graph


class ResearchResponse(BaseModel):
    result: Dict[str, Any]


class ResearchRequest(BaseModel):
    query: str


class SignupRequest(BaseModel):
    username: str
    password: str


class SignupResponse(BaseModel):
    message: str


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


def _sse_event(payload: Dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


router = APIRouter()


@router.post("/run_research_agent", response_model=ResearchResponse)
def run_research_agent(request: ResearchRequest):
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

    return {
        "result": result
    }


@router.get("/run_research_agent/stream")
def run_research_agent_stream(query: str):
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

            yield _sse_event({"type": "complete", "agentState": state})
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


@router.post("/signup", response_model=SignupResponse)
def signup(request: SignupRequest):
    username = request.username
    password = request.password

    # save to file right now, but ideally should be saved to a database
    with open("users.txt", "a") as f:
        f.write(f"{username}:{password}\n")
    

    return {"message": f"User {username} signed up successfully!"}


@router.post("/login", response_model=SignupResponse)
def login(request: SignupRequest):
    username = request.username
    password = request.password

    with open("users.txt", "r") as f:
        users = f.readlines()
    
    for user in users:
        stored_username, stored_password = user.strip().split(":")
        if stored_username == username and stored_password == password:
            return {"message": f"User {username} logged in successfully!"}
    
    return {"message": "Invalid username or password"}