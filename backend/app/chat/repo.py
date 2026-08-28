import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlmodel import select
from app.chat.models import ChatSession, ChatMessage
from app.chat.schemas import ChatSessionSummary, ChatMessageOut


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ChatRepo:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_or_create_session(self, session_id: str) -> ChatSession:
        result = await self.db.execute(
            select(ChatSession).where(ChatSession.session_id == session_id)
        )
        session = result.scalar_one_or_none()
        if session is None:
            session = ChatSession(session_id=session_id)
            self.db.add(session)
            await self.db.flush()
        return session

    async def save_message(
        self,
        chat_session_id: uuid.UUID,
        role: str,
        content: str,
        trace_url: str | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            chat_session_id=chat_session_id,
            role=role,
            content=content,
            trace_url=trace_url,
        )
        self.db.add(message)
        # Update session timestamp so sessions sort by most recent activity
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == chat_session_id)
            .values(updated_at=_utcnow())
        )
        await self.db.flush()
        return message


async def list_sessions(db: AsyncSession) -> list[ChatSessionSummary]:
    result = await db.execute(
        select(ChatSession).order_by(ChatSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    summaries = []
    for s in sessions:
        msgs = sorted(s.messages, key=lambda m: m.created_at)
        user_msgs = [m for m in msgs if m.role == "user"]
        asst_msgs = [m for m in msgs if m.role == "assistant"]
        title   = user_msgs[0].content[:60]  if user_msgs else "New conversation"
        preview = asst_msgs[-1].content[:80] if asst_msgs else ""
        summaries.append(ChatSessionSummary(
            session_id=s.session_id,
            title=title,
            preview=preview,
            created_at=s.created_at.isoformat() + "Z",
            updated_at=s.updated_at.isoformat() + "Z",
        ))
    return summaries


async def get_session_messages(db: AsyncSession, session_id: str) -> list[ChatMessageOut]:
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        return []
    msgs = sorted(session.messages, key=lambda m: m.created_at)
    return [
        ChatMessageOut(
            role=m.role,
            content=m.content,
            trace_url=m.trace_url,
            created_at=m.created_at.isoformat() + "Z",
        )
        for m in msgs
    ]
