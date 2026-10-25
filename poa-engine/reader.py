import io
import logging
from typing import List, Tuple
from pypdf import PdfReader
from PIL import Image

logger = logging.getLogger("poa_engine.reader")

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None


class DocumentReader:
    """Reads PDF or image documents, extracting text using PDF layer first, then OCR fallback."""

    def __init__(self):
        pass

    def read_document(self, file_bytes: bytes, filename: str) -> Tuple[str, List[float]]:
        """
        Returns (combined_text, per_page_confidences).
        Confidences: 100.0 for direct digital PDF text layer, 0.0-100.0 from OCR.
        """
        lower = filename.lower()
        if lower.endswith(".pdf"):
            return self._read_pdf(file_bytes)
        elif lower.endswith(".docx"):
            return self._read_docx(file_bytes)
        else:
            return self._read_image(file_bytes)

    def _read_docx(self, file_bytes: bytes) -> Tuple[str, List[float]]:
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            full_text = "\n".join(paragraphs)
            return full_text, [100.0]
        except Exception as e:
            logger.warning("Failed to parse docx directly: %s", e)
            return "", [0.0]

    def _read_pdf(self, file_bytes: bytes) -> Tuple[str, List[float]]:
        reader = PdfReader(io.BytesIO(file_bytes))
        page_texts = []
        confidences = []
        
        pages_to_ocr = []
        
        for idx, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            # If page text has meaningful content (more than 40 chars)
            if len(text) >= 40:
                page_texts.append(text)
                confidences.append(100.0)
            else:
                page_texts.append("")  # Placeholder
                confidences.append(0.0)
                pages_to_ocr.append(idx)

        # If any pages require OCR and tools are available
        if pages_to_ocr and convert_from_bytes and pytesseract:
            try:
                images = convert_from_bytes(file_bytes)
                for idx in pages_to_ocr:
                    if idx < len(images):
                        ocr_text, conf = self._ocr_image(images[idx])
                        page_texts[idx] = ocr_text
                        confidences[idx] = conf
            except Exception as e:
                logger.warning("PDF rasterization/OCR failed: %s", e)

        return "\n\n".join(page_texts), confidences

    def _read_image(self, file_bytes: bytes) -> Tuple[str, List[float]]:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            text, conf = self._ocr_image(image)
            return text, [conf]
        except Exception as e:
            logger.warning("Image OCR failed: %s", e)
            return "", [0.0]

    def _ocr_image(self, image: Image.Image) -> Tuple[str, float]:
        if not pytesseract:
            return "", 0.0
        try:
            # Extract detailed data for confidence calculation
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confs = [float(c) for c in data.get("conf", []) if str(c).strip() not in ("-1", "")]
            avg_conf = sum(confs) / len(confs) if confs else 50.0
            text = pytesseract.image_to_string(image)
            return text, round(avg_conf, 1)
        except Exception as e:
            logger.warning("Tesseract execution error: %s", e)
            return "", 0.0
