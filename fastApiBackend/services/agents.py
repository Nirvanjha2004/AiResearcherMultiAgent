
import json
import operator
from typing import TypedDict, Annotated, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.tools import DuckDuckGoSearchResults
from core.llm import llm # Ensure this points to your configured Groq/LLM instance
from models.schema import AgentState

# ==========================================
# 2. PROMPTS
# ==========================================
subquery_prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "You are an expert at breaking down complex user queries into smaller independent sub-queries. "
     "Each sub-query should be simple, atomic, and self-contained. "
     "Return ONLY a valid JSON array of strings. No explanation, no extra text."
    ),
    ("human", 
     "Break the following query into sub-queries:\n\n{query}"
    )
])

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "You are an expert technical writer and AI research synthesizer. "
     "Your task is to write a comprehensive, well-structured, and highly accurate report answering the user's original query.\n\n"
     "CRITICAL RULES:\n"
     "1. NO HALLUCINATIONS: You must base your entire report ONLY on the provided 'Raw Research Data'. Do not use your pre-trained knowledge to invent facts.\n"
     "2. FORMATTING: Use clean Markdown. Include an Introduction, clearly formatted sections (using ## headings), bullet points for readability, and a brief Conclusion.\n"
     "3. SYNTHESIS: Do not just copy-paste the raw data. Analyze it, find the common threads, and present a cohesive answer.\n"
     "4. MISSING INFO: If the raw data does not contain enough information to fully answer the query, explicitly state what information is missing."
    ),
    ("human", 
     "USER'S ORIGINAL QUERY:\n{original_query}\n\n"
     "RAW RESEARCH DATA GATHERED BY RESEARCHER:\n{raw_research_data}\n\n"
     "Please write the final Markdown report based strictly on the data above."
    )
])

reviewer_prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "You are a strict Quality Assurance (QA) Reviewer for an AI Research System. "
     "Your job is to evaluate the generated 'Final Report' against the 'Original User Query'.\n\n"
     "EVALUATION CRITERIA:\n"
     "1. Relevance: Does the report actually answer the original query?\n"
     "2. Completeness: Is the answer detailed enough, or is it too brief and superficial?\n"
     "3. Hallucination Check: Does the report sound factual and based on the provided context, or does it make things up?\n\n"
     "OUTPUT FORMAT:\n"
     "You must respond with ONLY a valid JSON object. No other text, no markdown block wrappers. Use this exact schema:\n"
     "{{\n"
     "  \"decision\": \"PASS\" or \"FAIL\",\n"
     "  \"feedback\": \"A 1-sentence explanation of why it passed or failed. If it failed, state exactly what is missing.\"\n"
     "}}"
    ),
    ("human", 
     "ORIGINAL QUERY:\n{original_query}\n\n"
     "FINAL REPORT DRAFT:\n{final_report}\n\n"
     "Evaluate the report and provide the JSON decision."
    )
])

# ==========================================
# 3. TOOLS
# ==========================================
search_tool = DuckDuckGoSearchResults()

# ==========================================
# 4. AGENT NODES
# ==========================================

def subQueryAgent(state: AgentState):
    print("--- PLANNER AGENT RUNNING ---")
    query = state.get("user_query", "")
    
    chain = subquery_prompt | llm
    response = chain.invoke({'query': query}).content
    
    try:
        # Clean potential markdown wrapping from LLM output
        clean_json = response.strip().replace("```json", "").replace("```", "")
        subqueries = json.loads(clean_json)
    except json.JSONDecodeError:
        print("Warning: Failed to parse Planner JSON. Falling back to original query.")
        subqueries = [query]
        
    return {'subqueries': subqueries}

def fetchRawDataAgent(state: AgentState):
    print("--- RESEARCHER AGENT RUNNING ---")
    sub_queries = state.get("subqueries", [])
    new_raw_data = []

    for query in sub_queries:
        print(f"Searching for: {query}")
        response = search_tool.invoke(query)
        new_raw_data.append(f"Results for '{query}':\n{response}")

    # LangGraph's operator.add will automatically append this to the existing list in state
    return {'raw_data': new_raw_data} 

def writerAgent(state: AgentState):
    print("--- WRITER AGENT RUNNING ---")
    # Convert the list of raw data strings into one giant text block for the LLM
    raw_research_data = "\n\n".join(state.get("raw_data", []))
    original_query = state.get("user_query", "")
    
    chain = writer_prompt | llm
    response = chain.invoke({
        "original_query": original_query,
        "raw_research_data": raw_research_data
    }).content

    return {"final_output": response}

def review_agent(state: AgentState):
    print("--- REVIEWER AGENT RUNNING ---")
    final_output = state.get("final_output", "")
    original_query = state.get("user_query", "") # Fixed missing variable here
    
    chain = reviewer_prompt | llm
    response = chain.invoke({
        "original_query": original_query,
        "final_report": final_output
    }).content

    try:
        clean_json = response.strip().replace("```json", "").replace("```", "")
        review_result = json.loads(clean_json)
        decision = review_result.get("decision", "FAIL")
        feedback = review_result.get("feedback", "No feedback provided.")
    except json.JSONDecodeError:
        decision = "FAIL"
        feedback = "System failed to parse reviewer JSON output."

    current_revisions = state.get("revision_count", 0)
    
    print(f"Review Decision: {decision}")
    print(f"Feedback: {feedback}")

    return {
        "review_decision": decision,
        "review_feedback": feedback,
        "revision_count": current_revisions + 1
    }