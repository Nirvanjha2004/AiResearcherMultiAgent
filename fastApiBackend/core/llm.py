import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# 1. Load the variables from the .env file into the system
load_dotenv()

# 2. Initialize the LLM
# ChatGroq will automatically detect os.environ["GROQ_API_KEY"] behind the scenes
llm = ChatGroq(
    model="llama-3.1-8b-instant",  # Excellent choice for fast agentic loops
    temperature=0
)