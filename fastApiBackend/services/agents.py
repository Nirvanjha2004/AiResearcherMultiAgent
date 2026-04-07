from llm import llm
from schema import myState
from langchain_core.prompts import ChatPromptTemplate
import json 
from langchain_community.tools import DuckDuckGoSearchResults

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

search_tool = DuckDuckGoSearchResults()
def subQueryAgent():
    query = myState["user_query"]
    chain = subquery_prompt | llm
    response = chain.invoke({'query' : query}).content
    subqueries = json.loads(response)
    return {'subqueries' : subqueries }

def fetchRawDataAgent():
    sub_query = myState.get("subqueries", []);
    raw_data = myState.get("raw_data", []);

    for query in sub_query:
        response = search_tool.invoke(query)
        raw_data.append(response)

    return {'raw_data' : raw_data } 


def writerAgent():
    raw_research_data = myState["raw_data"]
    original_query = myState["user_query"]
    chain = writer_prompt | llm
    response = chain.invoke({
        "original_query" : original_query,
        "raw_research_data" : raw_research_data
    }).content

    return {
        "final_output" : response
    }

def review_agent():
    final_output = myState["final_output"]
    chain = reviewer_prompt | llm
    response = chain.invoke({
        "original_query" : original_query,
        "final_report" : final_output
    }).content

    return {"reviewer_response" : response}

