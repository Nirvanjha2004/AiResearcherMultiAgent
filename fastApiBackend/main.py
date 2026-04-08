from fastapi import FastAPI
from api.routes.userRoute import router as user_router

app = FastAPI()

app.include_router(user_router, prefix="/users")