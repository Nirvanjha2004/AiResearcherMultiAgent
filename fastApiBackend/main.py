from fastapi import FastAPI

from api.routes.userRoute import router as user_router
from middleware import RequestLoggingMiddleware

app = FastAPI()

# Add middleware for request/response logging
app.add_middleware(RequestLoggingMiddleware)

app.include_router(user_router, prefix="/users")