import json
import logging
import time
from typing import Any, Dict, Optional

# Configure structured logger
logger = logging.getLogger("ai_researcher_backend")

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_auth_event(event_type: str, username: str, success: bool, details: Optional[Dict[str, Any]] = None) -> None:
    """Log authentication events (signup, login, logout)."""
    payload = {
        "event": "auth",
        "type": event_type,
        "username": username,
        "success": success,
        "timestamp": time.time(),
    }
    if details:
        payload.update(details)

    level = logging.INFO if success else logging.WARNING
    logger.log(level, f"Auth event: {json.dumps(payload)}")


def log_session_event(event_type: str, username: str, token: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
    """Log session lifecycle events (register, validate, expire, logout)."""
    payload = {
        "event": "session",
        "type": event_type,
        "username": username,
        "has_token": token is not None,
        "timestamp": time.time(),
    }
    if details:
        payload.update(details)

    logger.info(f"Session event: {json.dumps(payload)}")


def log_research_event(event_type: str, username: str, query: Optional[str] = None, success: bool = True, details: Optional[Dict[str, Any]] = None) -> None:
    """Log research lifecycle events (start, complete, error)."""
    payload = {
        "event": "research",
        "type": event_type,
        "username": username,
        "success": success,
        "query_length": len(query) if query else 0,
        "timestamp": time.time(),
    }
    if details:
        payload.update(details)

    level = logging.INFO if success else logging.ERROR
    logger.log(level, f"Research event: {json.dumps(payload)}")


def log_error(error_type: str, message: str, username: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
    """Log error events."""
    payload = {
        "event": "error",
        "type": error_type,
        "message": message,
        "username": username,
        "timestamp": time.time(),
    }
    if details:
        payload.update(details)

    logger.error(f"Error: {json.dumps(payload)}")
