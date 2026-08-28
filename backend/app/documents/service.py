import os
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.documents.schemas import DocumentResponse
from app.documents import repo
from app.exceptions import UnsupportedFileTypeError, DocumentIngestError
from app.rag.ingest import ingest_file, get_vectorstore
from app.config import settings

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
        await ingest_file(file_path, doc_id)
    except Exception as exc:
        raise DocumentIngestError(str(exc)) from exc

    # Verify against Qdrant — use actual stored vector count as authoritative chunk_count
    vs = get_vectorstore()
    qdrant_count = vs.client.count(
        collection_name=settings.qdrant_collection,
        count_filter=Filter(
            must=[FieldCondition(key="metadata.doc_id", match=MatchValue(value=doc_id))]
        ),
        exact=True,
    ).count

    await repo.save_record(
        db, doc_id=doc_id, filename=file.filename or "", chunk_count=qdrant_count
    )
    await db.commit()

    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename or "",
        chunks=qdrant_count,
        status="indexed",
    )
