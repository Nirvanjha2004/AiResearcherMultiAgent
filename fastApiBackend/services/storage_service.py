import json
import os
import tempfile
import time
from typing import Any, Dict, List

RESEARCH_SESSIONS_FILE = "research_sessions.json"
EXPORT_EVENTS_FILE = "export_events.json"


def read_json_store(file_path: str) -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(file_path):
        return {}

    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    except (json.JSONDecodeError, OSError):
        return {}

    return {}


def write_json_store(file_path: str, store: Dict[str, List[Dict[str, Any]]]) -> None:
    directory = os.path.dirname(file_path) or "."
    with tempfile.NamedTemporaryFile("w", delete=False, dir=directory) as temp_file:
        json.dump(store, temp_file)
        temp_path = temp_file.name

    os.replace(temp_path, file_path)


def current_timestamp() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
