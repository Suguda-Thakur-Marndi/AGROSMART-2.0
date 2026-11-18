from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class IrrigationCommand(BaseModel):
    device_id: str
    command_type: str
    payload: Optional[Dict[str, Any]] = None


class IrrigationSessionOut(BaseModel):
    id: int
    device_id: str
    zone: Optional[str] = None
    mode: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    water_volume_liters_est: Optional[float] = None
    trigger_moisture_start: Optional[float] = None
    trigger_moisture_end: Optional[float] = None

    model_config = {"from_attributes": True}


class ZoneConfig(BaseModel):
    zone: str
    moisture_on_threshold: float
    moisture_off_threshold: float
    mode: str = "auto"
