from fastapi import APIRouter

from app.health.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthResponse, status_code=200)
async def liveness():
    return HealthResponse(status="ok", service="fineval-api")
