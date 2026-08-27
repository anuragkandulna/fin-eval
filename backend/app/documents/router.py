from fastapi import APIRouter, File, HTTPException, UploadFile

from app.documents import service
from app.documents.schemas import DocumentResponse
from app.exceptions import DocumentIngestError, UnsupportedFileTypeError

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=200)
async def upload_document(file: UploadFile = File(...)):
    try:
        return await service.upload(file)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except DocumentIngestError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
