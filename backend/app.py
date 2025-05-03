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
from PIL import Image
import torch
import torchvision.transforms as T
import torchxrayvision as xrv

load_dotenv()
app = FastAPI()

# ──────────────────────────── CORS ────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─────────────────────────── MODELS ───────────────────────────
whisper_model = whisper.load_model("base")

xray_model = xrv.models.DenseNet(weights="densenet121-res224-all")
xray_model.eval()

# torchvision pipeline: Resize → CenterCrop → ToTensor
# Produces a 1×224×224 tensor (value range −1 … 1 after Normalize)
transform = T.Compose([
    T.Resize(256, antialias=True),   # min‑side → 256, keeps aspect
    T.CenterCrop(224),               # square 224×224
    T.ToTensor(),                    # PIL → Tensor (C,H,W); C = 1
    T.Normalize([0.5], [0.5])        # scale to −1 … 1
])

disease_labels = xray_model.pathologies

# ───────────────────────────── CHAT ───────────────────────────
@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_query = body.get("query", "")
    return route_query(user_query)

# ────────────────────────── TRANSCRIBE ────────────────────────
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        suffix = ".webm" if file.filename.endswith(".webm") else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(await file.read())
            input_path = temp_audio.name

        if suffix == ".webm":
            converted_path = tempfile.mktemp(suffix=".wav")
            ffmpeg_path = shutil.which("ffmpeg") or "ffmpeg"
            subprocess.run(
                [ffmpeg_path, "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-f", "wav", converted_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
        else:
            converted_path = input_path

        result = whisper_model.transcribe(converted_path)
        original_text = result["text"]
        lang = detect_language(original_text)
        english_text = translate_to_english(original_text, lang)
        return {"transcript": original_text, "english": english_text}

    except Exception:
        raise HTTPException(status_code=500, detail="Transcription error occurred.")
    finally:
        for path in [locals().get("input_path"), locals().get("converted_path")]:
            if path and os.path.exists(path):
                os.remove(path)

# ──────────────────────────── OCR IMAGE ───────────────────────
@app.post("/ocr/image")
async def ocr_image(file: UploadFile = File(...)):
    try:
        return {"text": extract_text_from_image(file)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Image failed: {str(e)}")

# ───────────────────────────── OCR PDF ────────────────────────
@app.post("/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    try:
        return {"text": extract_text_from_pdf(file)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR PDF failed: {str(e)}")

# ──────────────────────────── X‑RAY ANALYSIS ──────────────────
@app.post("/xray")
async def analyze_xray(file: UploadFile = File(...)):
    try:
        print("➡️  Received X‑ray upload")

        # Save upload to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        print("✅  File saved to:", temp_file_path)

        # Load & preprocess (grayscale)
        image = Image.open(temp_file_path).convert("L")
        img = transform(image).unsqueeze(0)       # [1,1,224,224]
        print("✅  Model input shape:", img.shape)

        # Inference
        with torch.no_grad():
            outputs = xray_model(img)[0]

        findings = [
            f"🔎 **{label}**: {round(float(prob) * 100, 2)}%"
            for label, prob in zip(disease_labels, outputs)
            if float(prob) > 0.40
        ]
        result_text = "\n".join(findings) if findings else "🩻 No significant abnormality detected."
        print("✅  X‑ray result:", result_text)

        return {"result": result_text}

    except Exception as e:
        print("❌  X‑ray processing failed:", str(e))
        raise HTTPException(status_code=500, detail=f"X‑ray analysis failed: {str(e)}")

    finally:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
