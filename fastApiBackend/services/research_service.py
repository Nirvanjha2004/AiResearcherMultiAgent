import json
from typing import Any, Dict

from models.schema import AgentState
from services.agents import fetchRawDataAgent, review_agent, subQueryAgent, writerAgent

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


def normalize_agent_state(query: str, payload: Any) -> Dict[str, Any]:
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

    return normalized


def normalize_persisted_session(payload: Any, query: str = "") -> Dict[str, Any]:
    source = payload if isinstance(payload, dict) else {}
    session_id = source.get("id") if isinstance(source.get("id"), str) else ""
    session_query = source.get("query") if isinstance(source.get("query"), str) else query
    result = source.get("result") if isinstance(source.get("result"), str) else ""
    created_at = source.get("createdAt") if isinstance(source.get("createdAt"), str) else ""
    agent_state_payload = source.get("agentState", {})
    normalized_agent_state = normalize_agent_state(session_query, agent_state_payload)

    return {
        "id": session_id,
        "query": session_query,
        "result": result,
        "createdAt": created_at,
        "agentState": normalized_agent_state,
    }


def normalize_export_event(username: str, payload: Any) -> Dict[str, Any]:
    source = payload if isinstance(payload, dict) else {}
    return {
        "id": source.get("id") if isinstance(source.get("id"), str) else "",
        "username": username,
        "action": source.get("action") if isinstance(source.get("action"), str) else "unknown",
        "status": source.get("status") if isinstance(source.get("status"), str) else "unknown",
        "session_id": source.get("session_id") if isinstance(source.get("session_id"), str) else None,
        "source": source.get("source") if isinstance(source.get("source"), str) else "result_viewer",
        "format": source.get("format") if isinstance(source.get("format"), str) else "markdown",
        "file_name": source.get("file_name") if isinstance(source.get("file_name"), str) else None,
        "content_length": source.get("content_length") if isinstance(source.get("content_length"), int) else 0,
        "error": source.get("error") if isinstance(source.get("error"), str) else None,
        "created_at": source.get("created_at") if isinstance(source.get("created_at"), str) else "",
    }
