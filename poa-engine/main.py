import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from reader import DocumentReader
from extractor import FieldExtractor
from engine import RulesEngine
from formatter import build_audit_result, build_jurisdiction_result

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("poa_engine")

app = FastAPI(
    title="ConcretePOA Deterministic Compliance Engine",
    description="Statutory power of attorney rule evaluation and document analysis engine.",
    version="1.0.0",
)

reader = DocumentReader()
extractor = FieldExtractor()
engine = RulesEngine()

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "poa-engine", "rules_loaded": list(engine.rules_cache.keys())}


@app.post("/analyze")
async def analyze(
    poa: UploadFile = File(...),
    mode: str = Form("audit"),
    bank: Optional[str] = Form(None),
    rejection: Optional[UploadFile] = File(None),
    customRules: Optional[str] = Form(None),
):
    """
    Accepts PDF or image document (max 10MB).
    Evaluates statutory requirements deterministically and returns exact Next.js report schema.
    """
    if not poa.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing name.")

    poa_bytes = await poa.read()
    if len(poa_bytes) == 0:
        raise HTTPException(status_code=400, detail="The POA document is empty.")
    if len(poa_bytes) > MAX_FILE_BYTES:
        raise HTTPException(status_code=400, detail="The POA document exceeds the 10 MB limit.")

    # Privacy: logs only contain sizes, counts, and metadata; NEVER raw text or PII
    logger.info("Processing POA analysis request. File size: %d bytes, Mode: %s", len(poa_bytes), mode)

    # 1. Document Reading (PDF text layer with OCR fallback)
    text, confidences = reader.read_document(poa_bytes, poa.filename)
    if not text.strip():
        raise HTTPException(status_code=422, detail="Unable to extract readable text from document.")

    # 2. Extract Legal Fields
    fields = extractor.extract(text)

    # 3. Evaluate Statutory Rules
    violations = engine.evaluate(fields)

    # 4. Format into exact ConcretePOA schema
    if mode == "jurisdiction":
        result = build_jurisdiction_result(fields, violations)
    else:
        # Default to audit mode
        target_bank = bank if bank and bank.strip() else "Standard Financial Review"
        result = build_audit_result(fields, violations, bank_target=target_bank)

    response_dict = result.model_dump()
    # Add engine attribution and OCR confidence metadata
    response_dict["_engine"] = "poa-engine-rules"
    response_dict["_ocr_confidence"] = confidences

    return JSONResponse(content=response_dict)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
