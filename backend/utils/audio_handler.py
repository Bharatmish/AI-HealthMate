import tempfile
import subprocess
import whisper
import os
from fastapi import UploadFile
from utils.language_utils import detect_language, translate_to_english

model = whisper.load_model("large")

async def transcribe_audio(file: UploadFile) -> dict:
    # Save uploaded WebM or other audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
        contents = await file.read()
        temp_webm.write(contents)
        temp_webm_path = temp_webm.name

    # Convert to WAV (16kHz mono)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
        temp_wav_path = temp_wav.name

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i", temp_webm_path,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        temp_wav_path
    ]

    try:
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print("❌ FFmpeg error:", e.stderr.decode())
        raise RuntimeError("FFmpeg conversion failed")

    # Run Whisper on the converted WAV
    result = model.transcribe(temp_wav_path)
    raw_text = result["text"]

    # Language detection + English translation
    lang = detect_language(raw_text)
    translated = translate_to_english(raw_text, lang)

    # Cleanup
    os.remove(temp_webm_path)
    os.remove(temp_wav_path)

    return {
        "transcript": raw_text,
        "english": translated
    }
