from fastapi import APIRouter, HTTPException

from app.analyse import service
from app.analyse.schemas import AnalyseRequest, AnalyseResponse
from app.exceptions import AgentInvocationError

router = APIRouter(prefix="/analyse", tags=["analyse"])


@router.post("", response_model=AnalyseResponse, status_code=200)
async def analyse(request: AnalyseRequest):
    try:
        return await service.analyse(request)
    except AgentInvocationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
