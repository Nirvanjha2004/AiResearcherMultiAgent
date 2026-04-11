from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class UserProfile(BaseModel):
    username: str
    email: str
    display_name: str
    created_at: str


class AuthResponse(BaseModel):
    message: str
    token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile


class SessionResponse(BaseModel):
    authenticated: bool
    username: str
    user: UserProfile


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None


class ResearchRequest(BaseModel):
    query: str


class ResearchResponse(BaseModel):
    result: Dict[str, Any]


class SignupRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    display_name: Optional[str] = None


class SignupResponse(BaseModel):
    message: str


class ExportEventRequest(BaseModel):
    action: str
    status: str
    session_id: Optional[str] = None
    source: str = "result_viewer"
    format: str = "markdown"
    file_name: Optional[str] = None
    content_length: int = 0
    error: Optional[str] = None


class ExportLifecycleEvent(BaseModel):
    id: str
    username: str
    action: str
    status: str
    session_id: Optional[str] = None
    source: str
    format: str
    file_name: Optional[str] = None
    content_length: int
    error: Optional[str] = None
    created_at: str


class PersistedSession(BaseModel):
    id: str
    query: str
    result: str
    createdAt: str
    agentState: Dict[str, Any]
