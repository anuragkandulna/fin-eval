from pydantic import BaseModel


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str


class DocumentListItem(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    status: str
    created_at: str  # ISO 8601 UTC string
