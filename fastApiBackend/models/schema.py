# ==========================================
# 1. STATE DEFINITION (Crucial for LangGraph)
# ==========================================
import operator
from typing import TypedDict, Annotated, List

class AgentState(TypedDict):
    user_query: str
    subqueries: List[str]
    # operator.add tells LangGraph to append new data to the existing list, not overwrite it
    raw_data: Annotated[List[str], operator.add] 
    final_output: str
    review_decision: str
    review_feedback: str
    revision_count: int