import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.chat.models import ChatSession, ChatMessage


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
        await self.db.flush()
        return message
