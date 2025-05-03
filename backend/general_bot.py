import os
import requests
from dotenv import load_dotenv
load_dotenv()

def query_general_bot(user_query: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "user", "content": user_query}
        ]
    }
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers)

    if response.status_code != 200:
        print("❌ Groq API error:", response.text)
        return "Sorry, I couldn't generate a response right now."

    try:
        return response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        print("❌ Unexpected Groq response format:", response.json())
        return "Sorry, I couldn't generate a valid response."
