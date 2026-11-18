from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.irrigation_session import IrrigationSession
from app.models.sensor_reading import SensorReading


async def get_sensor_history(db: AsyncSession, device_id: str, hours: int = 24) -> List[SensorReading]:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.device_id == device_id, SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
    )
    return list(result.scalars().all())


async def get_water_summary(db: AsyncSession, device_id: str, days: int = 7) -> Dict[str, Any]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(IrrigationSession).where(
            IrrigationSession.device_id == device_id,
            IrrigationSession.started_at >= since,
        )
    )
    sessions = list(result.scalars().all())

    total_duration = sum((s.duration_seconds or 0) for s in sessions)
    total_water = sum((s.water_volume_liters_est or 0) for s in sessions)

    return {
        "device_id": device_id,
        "days": days,
        "total_sessions": len(sessions),
        "total_duration_seconds": total_duration,
        "total_water_liters_est": total_water,
        "sessions": [
            {
                "id": s.id,
                "zone": s.zone,
                "mode": s.mode,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "duration_seconds": s.duration_seconds,
                "water_volume_liters_est": s.water_volume_liters_est,
            }
            for s in sessions
        ],
    }
