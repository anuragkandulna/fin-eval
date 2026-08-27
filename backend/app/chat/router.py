from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.chat import service
from app.chat.schemas import ChatRequest, ChatResponse
from app.exceptions import AgentInvocationError

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=200)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await service.chat(request, db)
    except AgentInvocationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
