from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import DocumentResponse
from app.rag.ingest import ingest_file
import uuid
import os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    ALLOWED = {".pdf", ".txt", ".md", ".docx", ".csv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED))}",
        )

    doc_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    chunks = await ingest_file(file_path, doc_id)

    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunks=chunks,
        status="processed",
    )
