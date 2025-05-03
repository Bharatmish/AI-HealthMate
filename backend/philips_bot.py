import os
import requests
from dotenv import load_dotenv
from embedding_loader import get_chroma_collection

load_dotenv()

def query_philips_bot(user_query: str, top_k: int = 3, threshold: float = 0.75) -> tuple[str, float]:
    collection = get_chroma_collection()
    results = collection.query(query_texts=[user_query], n_results=top_k)

    if not results["documents"] or not results["documents"][0]:
        return "", 0.0

    top_score = results["distances"][0][0]
    if top_score > threshold:
        return "", top_score

    context = "\n\n".join([f"{i+1}. {doc}" for i, doc in enumerate(results["documents"][0])])
    prompt = f"Use the context below to answer the user's question.\n\nContext:\n{context}\n\nUser: {user_query}"

    answer = query_groq_llm(prompt)
    return answer, top_score

def query_groq_llm(prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=data, headers=headers)

    if response.status_code != 200:
        print("❌ Groq error:", response.text)
        return "Sorry, something went wrong."

    try:
        return response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        print("❌ Groq format error:", response.json())
        return "Sorry, I couldn’t generate an answer."
