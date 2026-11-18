from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SensorReadingCreate(BaseModel):
    device_id: str
    veg_moisture: Optional[float] = None
    paddy_moisture: Optional[float] = None
    ph: Optional[float] = None
    soil_temp: Optional[float] = None
    air_temp: Optional[float] = None
    air_humidity: Optional[float] = None
    pump_active: bool = False
    veg_valve: bool = False
    paddy_valve: bool = False
    irrigation_mode: Optional[str] = None
    active_zone: Optional[str] = None
    error_bitmask: int = 0


class SensorReadingOut(BaseModel):
    id: int
    device_id: str
    timestamp: datetime
    veg_moisture: Optional[float] = None
    paddy_moisture: Optional[float] = None
    ph: Optional[float] = None
    soil_temp: Optional[float] = None
    air_temp: Optional[float] = None
    air_humidity: Optional[float] = None
    pump_active: bool
    veg_valve: bool
    paddy_valve: bool
    irrigation_mode: Optional[str] = None
    active_zone: Optional[str] = None
    error_bitmask: int

    model_config = {"from_attributes": True}


class TelemetryPacket(BaseModel):
    """JSON packet sent by the Arduino device."""
    device_id: str
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
    veg_moisture: Optional[float] = None
    paddy_moisture: Optional[float] = None
    ph: Optional[float] = None
    soil_temp: Optional[float] = None
    air_temp: Optional[float] = None
    air_humidity: Optional[float] = None
    pump_active: bool = False
    veg_valve: bool = False
    paddy_valve: bool = False
    irrigation_mode: Optional[str] = None
    active_zone: Optional[str] = None
    error_bitmask: int = 0
