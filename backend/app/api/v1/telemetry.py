from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.sensor_reading import SensorReading
from app.schemas.sensor import SensorReadingOut, TelemetryPacket
from app.services.telemetry_service import ingest_telemetry

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


def verify_device_key(x_device_key: Optional[str] = Header(default=None)):
    if x_device_key != settings.DEVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid device API key")


@router.post("", response_model=SensorReadingOut, status_code=status.HTTP_201_CREATED)
async def post_telemetry(
    packet: TelemetryPacket,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_device_key),
):
    reading = await ingest_telemetry(db, packet.device_id, packet)
    return reading


@router.get("/latest/{device_id}", response_model=SensorReadingOut)
async def get_latest(device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.device_id == device_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(1)
    )
    reading = result.scalar_one_or_none()
    if not reading:
        raise HTTPException(status_code=404, detail="No telemetry found for device")
    return reading


@router.get("/history/{device_id}", response_model=List[SensorReadingOut])
async def get_history(device_id: str, hours: int = 24, db: AsyncSession = Depends(get_db)):
    from app.services.analytics_service import get_sensor_history
    readings = await get_sensor_history(db, device_id, hours)
    return readings
