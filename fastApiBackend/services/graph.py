from langgraph.graph import StateGraph, START, END
from schema import AgentState
builder = StateGraph(AgentState)

def decide(AgentState):
    decision = AgentState["review_decision"]
    if decision == "PASS":
        return END
    else return "writerAgentNode"

builder.add_node("subQueryAgentNode", subQueryAgent)
builder.add_node("fetchRawDataAgentNode", fetchRawDataAgent)
builder.add_node("writerAgentNode", writerAgent)
builder.add_node("review_agentNode", review_agent)

builder.add_edge(START, "subQueryAgentNode")
builder.add_edge("subQueryAgentNode", "fetchRawDataAgentNode")
builder.add_edge("fetchRawDataAgentNode", "writerAgentNode")
builder.add_edge("writerAgentNode", "review_agentNode")
builder.add_conditional_edges("review_agentNode", decide)

graph = builder.compile()


