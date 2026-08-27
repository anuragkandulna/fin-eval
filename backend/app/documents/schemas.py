from pydantic import BaseModel


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str
