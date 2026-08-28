from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.profile import repo
from app.profile.schemas import DashboardResponse, PersonalDataResponse

router = APIRouter(tags=["profile"])


@router.get("/dashboard", response_model=DashboardResponse, status_code=200)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    data = await repo.get_dashboard(db)
    if data is None:
        raise HTTPException(status_code=404, detail="Dashboard data not seeded yet. Run scripts/seed.py.")
    return data


@router.get("/personal", response_model=PersonalDataResponse, status_code=200)
async def get_personal(db: AsyncSession = Depends(get_db)):
    data = await repo.get_personal(db)
    if data is None:
        raise HTTPException(status_code=404, detail="Personal data not seeded yet. Run scripts/seed.py.")
    return data
