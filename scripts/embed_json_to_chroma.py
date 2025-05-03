import json
import os
from tqdm import tqdm
import chromadb
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# ✅ Local embedding function using Hugging Face model
class LocalEmbeddingFunction:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def __call__(self, input: list[str]) -> list[list[float]]:
        return self.model.encode(input).tolist()

# ✅ Load env vars (if needed later)
load_dotenv()

# ✅ Load Philips Q&A data
with open("data/faq_chunks.json", "r", encoding="utf-8") as f:
    faq_data = json.load(f)

# ✅ Initialize ChromaDB with local embedding
chroma_client = chromadb.PersistentClient(path="./chroma_db")
embedding_fn = LocalEmbeddingFunction()
collection = chroma_client.get_or_create_collection(
    name="philips_faqs",
    embedding_function=embedding_fn
)

# ✅ Loop through data and embed
for idx, item in enumerate(tqdm(faq_data)):
    question = item["question"]
    answer = item["answer"]
    content = f"Q: {question}\nA: {answer}"
    metadata = {
        "product": item.get("product", ""),
        "category": item.get("category", "")
    }

    try:
        collection.add(
            documents=[content],
            ids=[str(idx)],
            metadatas=[metadata]
        )
    except Exception as e:
        print(f"❌ Error at index {idx}: {e}")

print("✅ All Q&A embedded successfully into ChromaDB.")
