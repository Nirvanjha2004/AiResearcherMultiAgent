import time
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from services.logging_service import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = request.headers.get("x-request-id", f"req-{int(start_time * 1000)}")

        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"

        try:
            response = await call_next(request)
            duration = time.time() - start_time

            logger.info(
                f"HTTP {method} {path} - Status: {response.status_code} - Duration: {duration:.3f}s - Client: {client_host} - RequestID: {request_id}"
            )

            return response
        except Exception as exc:
            duration = time.time() - start_time
            logger.error(
                f"HTTP {method} {path} - Error: {str(exc)} - Duration: {duration:.3f}s - Client: {client_host} - RequestID: {request_id}"
            )
            raise
