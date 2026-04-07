from llm import llm
from schema import myState
from langchain_core.prompts import ChatPromptTemplate
import json 
prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "You are an expert at breaking down complex user queries into smaller independent sub-queries. "
     "Each sub-query should be simple, atomic, and self-contained. "
     "Return ONLY a valid JSON array of strings. No explanation, no extra text."
    ),
    ("human", 
     "Break the following query into sub-queries:\n\n{query}"
    )
])
def subQueryAgent(string query):
    chain = prompt | llm
    response = chain.invoke({'query' : query}).content
    subqueries = json.loads(response)
    myState['subqueries'] = subqueries

def fetchRawDataAgent():
    