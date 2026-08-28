from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.chat import service
from app.chat import repo as chat_repo
from app.chat.schemas import ChatRequest, ChatResponse, ChatSessionSummary, ChatMessageOut
from app.exceptions import AgentInvocationError

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=200)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await service.chat(request, db)
    except AgentInvocationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sessions", response_model=list[ChatSessionSummary], status_code=200)
async def list_sessions(db: AsyncSession = Depends(get_db)):
    return await chat_repo.list_sessions(db)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut], status_code=200)
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    return await chat_repo.get_session_messages(db, session_id)
