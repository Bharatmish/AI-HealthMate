import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import tempfile
import os
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(image_file) -> str:
    try:
        img = Image.open(image_file.file)
        return pytesseract.image_to_string(img)
    except Exception as e:
        return f"Image OCR failed: {str(e)}"

def extract_text_from_pdf(pdf_file) -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(pdf_file.file.read())
            temp_path = temp.name

        text = ""
        with fitz.open(temp_path) as doc:
            for page in doc:
                text += page.get_text()

        return text
    except Exception as e:
        return f"PDF OCR failed: {str(e)}"
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
