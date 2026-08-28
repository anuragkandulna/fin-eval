import os
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.documents.schemas import DocumentResponse
from app.documents import repo
from app.exceptions import UnsupportedFileTypeError, DocumentIngestError
from app.rag.ingest import ingest_file

UPLOAD_DIR = "/tmp/uploads"
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".csv"}

os.makedirs(UPLOAD_DIR, exist_ok=True)


async def upload(file: UploadFile, db: AsyncSession) -> DocumentResponse:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    doc_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        chunks = await ingest_file(file_path, doc_id)
    except Exception as exc:
        raise DocumentIngestError(str(exc)) from exc

    await repo.save_record(db, doc_id=doc_id, filename=file.filename or "", chunk_count=chunks)
    await db.commit()

    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename or "",
        chunks=chunks,
        status="indexed",
    )
