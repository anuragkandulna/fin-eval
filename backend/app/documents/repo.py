from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.documents.models import DocumentRecord


async def save_record(db: AsyncSession, doc_id: str, filename: str, chunk_count: int, status: str = "indexed") -> DocumentRecord:
    record = DocumentRecord(doc_id=doc_id, filename=filename, chunk_count=chunk_count, status=status)
    db.add(record)
    await db.flush()
    return record


async def list_records(db: AsyncSession) -> list[DocumentRecord]:
    result = await db.execute(select(DocumentRecord).order_by(DocumentRecord.created_at.desc()))
    return list(result.scalars().all())
