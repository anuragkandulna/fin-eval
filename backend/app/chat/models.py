import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: str = Field(..., max_length=255, unique=True, index=True)
    clerk_user_id: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    messages: list["ChatMessage"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chat_session_id: uuid.UUID = Field(foreign_key="chat_sessions.id")
    role: str = Field(..., max_length=16)  # "user" | "assistant"
    content: str
    trace_url: Optional[str] = Field(default=None, max_length=512)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: Optional[ChatSession] = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={"lazy": "selectin"},
    )
