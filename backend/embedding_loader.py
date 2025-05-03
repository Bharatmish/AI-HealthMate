import os
import uuid
import json
import chromadb
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer

# ─────────────────────────────────────────────
# Embedding function
# ─────────────────────────────────────────────
class LocalEmbeddingFunction:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def __call__(self, input: List[str]) -> List[List[float]]:
        return self.model.encode(input).tolist()

# ─────────────────────────────────────────────
# ChromaDB setup
# ─────────────────────────────────────────────
embedding_fn = LocalEmbeddingFunction()
chroma_client = chromadb.PersistentClient(path=os.path.abspath("../chroma_db"))

collection = chroma_client.get_or_create_collection(
    name="philips_faqs",
    embedding_function=embedding_fn,
    metadata={"hnsw:space": "cosine"},
)

SIM_THRESHOLD = 0.6  # relaxed for similarity tolerance

# ─────────────────────────────────────────────
# Query top match
# ─────────────────────────────────────────────
def get_top_match(query: str, top_k: int = 1) -> Optional[Dict]:
    result = collection.query(query_texts=[query], n_results=top_k)

    doc = result["documents"][0][0] if result["documents"][0] else None
    distance = result["distances"][0][0] if result["distances"][0] else None
    meta = result["metadatas"][0][0] if result["metadatas"][0] else {}

    if doc is None or distance is None or distance > SIM_THRESHOLD:
        print(f"⚠️ No good match (distance={distance}) → fallback")
        return None

    return {
        "answer": meta.get("answer", "No answer found."),
        "score": distance,
        "product": meta.get("product", "Philips Device")
    }

# ─────────────────────────────────────────────
# Load and embed questions only
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python embedding_loader.py ../data/faq_chunks.json")
        exit()

    path = sys.argv[1]
    with open(path, "r", encoding="utf-8") as f:
        faqs = json.load(f)

    print(f"🔄 Embedding {len(faqs)} questions...")
    ids, docs, metas = [], [], []

    for row in faqs:
        q = row.get("question", "").strip()
        a = row.get("answer", "").strip()
        if not q or not a:
            continue

        ids.append(str(uuid.uuid4()))
        docs.append(f"Q: {q} A: {a}")  # ✅ Only embed the question
        metas.append({ "product": row.get("product", "Unknown")})

    collection.add(ids=ids, documents=docs, metadatas=metas)
    print("✅ Done. Total documents in Chroma:", collection.count())
