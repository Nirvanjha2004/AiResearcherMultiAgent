from typing import TypedDict, List

class myState(TypedDict):
    user_query : string
    subqueries : List[string]
    final_output : string