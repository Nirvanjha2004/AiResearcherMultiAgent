from fastapi import APIRouter
from pydantic import BaseModel
from graph import graph
class ResearchResponse(BaseModel): 
    response : str

class ResearchRequest(BaseModel): 
    query : str

router = APIRouter()

@router.post("/run_research_agent", research_model = ResearchResponse)
def run_research_agent(request : ResearchRequest):
    query = request.query
    result = graph.invoke({
        "query" : query
    })

    return {
        "result" : result
    }