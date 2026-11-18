from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.sensor import SensorReadingOut
from app.services.analytics_service import get_sensor_history, get_water_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/sensor-history/{device_id}", response_model=List[SensorReadingOut])
async def sensor_history(device_id: str, hours: int = 24, db: AsyncSession = Depends(get_db)):
    return await get_sensor_history(db, device_id=device_id, hours=hours)


@router.get("/water-summary/{device_id}")
async def water_summary(device_id: str, days: int = 7, db: AsyncSession = Depends(get_db)):
    return await get_water_summary(db, device_id=device_id, days=days)
