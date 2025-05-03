from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from query_router import route_query
from utils.ocr_handler import extract_text_from_image, extract_text_from_pdf
from utils.language_utils import detect_language, translate_to_english
import whisper
import tempfile
import shutil
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load Whisper model once
whisper_model = whisper.load_model("base")

# ---------- Chat route ----------
@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_query = body.get("query", "")
    result = route_query(user_query)
    return result

# ---------- Audio transcription route (with translation) ----------
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # Save uploaded file to temp location
        suffix = ".webm" if file.filename.endswith(".webm") else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            contents = await file.read()
            temp_audio.write(contents)
            input_path = temp_audio.name

        # Convert to WAV if necessary
        if suffix == ".webm":
            converted_path = tempfile.mktemp(suffix=".wav")
            ffmpeg_path = shutil.which("ffmpeg") or "ffmpeg"
            try:
                subprocess.run(
                    [ffmpeg_path, "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-f", "wav", converted_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
                )
            except subprocess.CalledProcessError as e:
                print("❌ FFmpeg error:", e.stderr.decode())
                raise HTTPException(status_code=500, detail="FFmpeg conversion failed.")
        else:
            converted_path = input_path

        # Transcribe with Whisper
        result = whisper_model.transcribe(converted_path)
        original_text = result["text"]

        # Detect language & translate to English
        lang = detect_language(original_text)
        english_text = translate_to_english(original_text, lang)

        return {
            "transcript": original_text,
            "english": english_text
        }

    except Exception as e:
        print("❌ Transcription failed:", str(e))
        raise HTTPException(status_code=500, detail="Transcription error occurred.")

    finally:
        # Cleanup temp files
        for path in [locals().get("input_path"), locals().get("converted_path")]:
            if path and os.path.exists(path):
                os.remove(path)

# ---------- OCR Image ----------
@app.post("/ocr/image")
async def ocr_image(file: UploadFile = File(...)):
    try:
        return {"text": extract_text_from_image(file)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Image failed: {str(e)}")

# ---------- OCR PDF ----------
@app.post("/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    try:
        return {"text": extract_text_from_pdf(file)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR PDF failed: {str(e)}")
