from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.documents import service, repo
from app.documents.schemas import DocumentListItem, DocumentResponse
from app.exceptions import DocumentIngestError, UnsupportedFileTypeError

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/list", response_model=list[DocumentListItem], status_code=200)
async def list_documents(db: AsyncSession = Depends(get_db)):
    records = await repo.list_records(db)
    return [
        DocumentListItem(
            doc_id=r.doc_id,
            filename=r.filename,
            chunk_count=r.chunk_count,
            status=r.status,
            created_at=r.created_at.isoformat() + "Z",
        )
        for r in records
    ]


@router.post("/upload", response_model=DocumentResponse, status_code=200)
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        return await service.upload(file, db)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except DocumentIngestError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
