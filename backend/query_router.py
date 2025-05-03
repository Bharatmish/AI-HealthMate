from embedding_loader import get_top_match
from utils.language_utils import detect_language, translate_to_english, translate_from_english
from utils.groq_fallback import get_mixtral_response

def route_query(user_query: str) -> dict:
    """
    Steps:
    1. Translate user query to English (if needed)
    2. Match against Chroma (question embeddings)
    3. If matched → rephrase the stored answer via Mixtral
    4. Else → full fallback to Mixtral with query as prompt
    5. Translate response back to original language (if needed)
    """

    # Step 1: Translate to English
    lang = detect_language(user_query)
    english_query = translate_to_english(user_query, lang)

    # Step 2: Find best match from embedded questions
    match = get_top_match(english_query)

    # Step 3: Either rephrase stored answer or fully fallback
    if match:
        prompt = (
            f"The user asked a question related to Philips monitors:\n\n"
            f"\"{english_query}\"\n\n"
            f"{match['answer']}\n\n"
            f"Please summarize or rephrase the answer clearly and professionally."
        )
        english_response = get_mixtral_response(prompt)
        source = match["product"]
    else:
        english_response = get_mixtral_response(english_query)
        source = "Mixtral Fallback"

    # Step 4: Translate response back to user language
    translated_response = translate_from_english(english_response, lang)

    return {
        "source": source,
        "answer": translated_response
    }
