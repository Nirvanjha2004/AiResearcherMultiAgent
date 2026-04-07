from langgraph.graph import StateGraph, START, END
from schema import AgentState # Assuming your state is in schema.py
from agents import subQueryAgent, fetchRawDataAgent, writerAgent, review_agent

# 1. Define the routing logic safely
def decide(state: AgentState):
    decision = state.get("review_decision", "FAIL")
    revisions = state.get("revision_count", 0)

    print(f"--- ROUTING DECISION: {decision} (Revision {revisions}) ---")

    if decision == "PASS":
        return END
    elif revisions >= 2:
        # Force an exit to prevent infinite API loops
        print("Max revisions reached. Forcing END.")
        return END
    else:
        # Loop back to the very beginning to get better search queries
        print("Review failed. Looping back to Planner.")
        return "subQueryAgentNode"

# 2. Initialize the Graph
builder = StateGraph(AgentState)

# 3. Add Nodes
builder.add_node("subQueryAgentNode", subQueryAgent)
builder.add_node("fetchRawDataAgentNode", fetchRawDataAgent)
builder.add_node("writerAgentNode", writerAgent)
builder.add_node("review_agentNode", review_agent)

# 4. Add Standard Edges
builder.add_edge(START, "subQueryAgentNode")
builder.add_edge("subQueryAgentNode", "fetchRawDataAgentNode")
builder.add_edge("fetchRawDataAgentNode", "writerAgentNode")
builder.add_edge("writerAgentNode", "review_agentNode")

# 5. Add Conditional Edges
builder.add_conditional_edges("review_agentNode", decide)

# 6. Compile the application
graph = builder.compile()