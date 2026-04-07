from typing import TypedDict, Annotated

class myState(TypedDict):
    user_query : str
    subqueries : list[str]
    raw_data : Annotated[list[str] , operator.add]
    final_output : str