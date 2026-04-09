from fastapi import APIRouter
from pydantic import BaseModel
from graph import graph
class ResearchResponse(BaseModel): 
    response : str

class ResearchRequest(BaseModel): 
    query : str

class SignupRequest(BaseModel):
    username : str
    password : str

class SignupResponse(BaseModel):
    message : str


router = APIRouter()

@router.post("/run_research_agent", response_model = ResearchResponse)
def run_research_agent(request : ResearchRequest):
    query = request.query
    result = graph.invoke({
        "query" : query
    })

    return {
        "result" : result
    }

@router.post("/signup" , response_model = SignupResponse)
def signup(request : SignupRequest):
    username = request.username
    password = request.password

    # save to file right now, but ideally should be saved to a database
    with open("users.txt", "a") as f:
        f.write(f"{username}:{password}\n")
    

    return {
        "message" : f"User {username} signed up successfully!"
    }

@router.post("/login", response_model = SignupResponse)
def login(request : SignupRequest):
    username = request.username
    password = request.password

    with open("users.txt", "r") as f:
        users = f.readlines()
    
    for user in users:
        stored_username, stored_password = user.strip().split(":")
        if stored_username == username and stored_password == password:
            return {
                "message" : f"User {username} logged in successfully!"
            }
    
    return {
        "message" : "Invalid username or password"
    }