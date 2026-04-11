import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

USERS_FILE = "users.txt"
USER_PROFILES_FILE = "user_profiles.json"
AUTH_SECRET = os.getenv("AUTH_SECRET", "dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


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


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def sign(data: str) -> str:
    digest = hmac.new(AUTH_SECRET.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
    return b64url(digest)


def create_token(username: str) -> Dict[str, Any]:
    exp = int(time.time()) + TOKEN_TTL_SECONDS
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    payload = b64url(json.dumps({"sub": username, "exp": exp}, separators=(",", ":")).encode("utf-8"))
    body = f"{header}.{payload}"
    signature = sign(body)
    token = f"{body}.{signature}"
    return {"token": token, "exp": exp}


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    body = f"{parts[0]}.{parts[1]}"
    expected_sig = sign(body)
    if not hmac.compare_digest(parts[2], expected_sig):
        return None

    try:
        payload = json.loads(b64url_decode(parts[1]).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None

    exp = payload.get("exp")
    if not isinstance(exp, int) or exp < int(time.time()):
        return None

    return payload


def read_users() -> Dict[str, str]:
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


def save_user(username: str, password: str) -> None:
    with open(USERS_FILE, "a") as f:
        f.write(f"{username}:{password}\n")


def read_user_profiles_store() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(USER_PROFILES_FILE):
        return {}

    try:
        with open(USER_PROFILES_FILE, "r") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    except (json.JSONDecodeError, OSError):
        return {}

    return {}


def write_user_profiles_store(store: Dict[str, Dict[str, Any]]) -> None:
    with open(USER_PROFILES_FILE, "w") as f:
        json.dump(store, f)


def normalize_user_profile(username: str, payload: Any) -> Dict[str, Any]:
    source = payload if isinstance(payload, dict) else {}
    created_at = source.get("created_at") if isinstance(source.get("created_at"), str) else time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    email = source.get("email") if isinstance(source.get("email"), str) and source.get("email") else username

    profile = UserProfile(
        username=username,
        email=email,
        display_name=source.get("display_name") if isinstance(source.get("display_name"), str) and source.get("display_name") else username,
        created_at=created_at,
    )
    return profile.model_dump()


def get_user_profile(username: str) -> Dict[str, Any]:
    profiles = read_user_profiles_store()
    existing = profiles.get(username)
    if existing:
        normalized = normalize_user_profile(username, existing)
        profiles[username] = normalized
        write_user_profiles_store(profiles)
        return normalized

    normalized = normalize_user_profile(username, {"email": username, "display_name": username})
    profiles[username] = normalized
    write_user_profiles_store(profiles)
    return normalized


def upsert_user_profile(username: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    profiles = read_user_profiles_store()
    normalized = normalize_user_profile(username, profile_data)
    profiles[username] = normalized
    write_user_profiles_store(profiles)
    return normalized


def extract_bearer_token(authorization: Optional[str], token_query: Optional[str] = None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            return token

    if token_query:
        return token_query

    raise ValueError("Missing auth token")


def register_session(token: str, username: str, exp: int) -> None:
    ACTIVE_SESSIONS[token] = {"username": username, "exp": exp}


def authenticate(authorization: Optional[str], token_query: Optional[str] = None) -> str:
    token = extract_bearer_token(authorization, token_query)
    payload = verify_token(token)
    if payload is None:
        raise ValueError("Invalid or expired auth token")

    session = ACTIVE_SESSIONS.get(token)
    if not session:
        raise ValueError("Session not found")

    if not isinstance(session.get("exp"), int) or session["exp"] < int(time.time()):
        ACTIVE_SESSIONS.pop(token, None)
        raise ValueError("Session expired")

    username = payload.get("sub")
    if not isinstance(username, str) or username != session.get("username"):
        raise ValueError("Invalid session")

    return username


def logout_token(authorization: Optional[str], token_query: Optional[str] = None) -> None:
    auth_token = extract_bearer_token(authorization, token_query)
    ACTIVE_SESSIONS.pop(auth_token, None)
