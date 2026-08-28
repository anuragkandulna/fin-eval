import uuid
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class DocumentRecord(SQLModel, table=True):
    __tablename__ = "document_records"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doc_id: str = Field(max_length=255, unique=True, index=True)
    filename: str = Field(max_length=512)
    chunk_count: int = 0
    status: str = Field(max_length=16, default="indexed")  # "indexed" | "processing"
    created_at: datetime = Field(default_factory=_utcnow)
