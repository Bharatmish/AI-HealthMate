from langdetect import detect
from deep_translator import GoogleTranslator

def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "en"  # fallback

def translate_to_english(text: str, src_lang: str) -> str:
    if src_lang == "en":
        return text
    return GoogleTranslator(source=src_lang, target="en").translate(text)

def translate_from_english(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    return GoogleTranslator(source="en", target=target_lang).translate(text)
