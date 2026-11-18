from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.irrigation_session import IrrigationSession
from app.schemas.irrigation import IrrigationCommand, IrrigationSessionOut, ZoneConfig
from app.services.irrigation_service import dispatch_command

router = APIRouter(prefix="/irrigation", tags=["irrigation"])


@router.post("/command", status_code=status.HTTP_201_CREATED)
async def post_command(command: IrrigationCommand, db: AsyncSession = Depends(get_db)):
    cmd = await dispatch_command(
        db,
        device_id=command.device_id,
        command_type=command.command_type,
        payload=command.payload,
    )
    return {"id": cmd.id, "status": cmd.status, "command_type": cmd.command_type}


@router.get("/sessions/{device_id}", response_model=List[IrrigationSessionOut])
async def list_sessions(device_id: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(IrrigationSession)
        .where(IrrigationSession.device_id == device_id)
        .order_by(IrrigationSession.started_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/config/{device_id}")
async def get_config(device_id: str):
    return {
        "device_id": device_id,
        "vegetable_zone": {
            "moisture_on_threshold": settings.VEG_MOISTURE_ON,
            "moisture_off_threshold": settings.VEG_MOISTURE_OFF,
            "flow_rate_lpm": 15.0,
            "max_runtime_minutes": 15,
        },
        "paddy_zone": {
            "moisture_on_threshold": settings.PADDY_MOISTURE_ON,
            "moisture_off_threshold": settings.PADDY_MOISTURE_OFF,
            "flow_rate_lpm": 12.0,
            "max_runtime_minutes": 30,
        },
        "pump": {
            "rated_voltage": 12.0,
            "rated_current": 1.0,
            "lead_time_ms": 1500,
            "lag_time_ms": 1000,
            "cooldown_time_ms": 180000,
        },
    }
