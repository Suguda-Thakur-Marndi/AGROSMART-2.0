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
    """JSON packet sent by the Arduino device over Wi-Fi or Bluetooth."""
    device_id: str = "agrosmart-mega-01"
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
    
    # Standard field names
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

    # Compact aliases sent directly by firmware TelemetryBuilder
    ts: Optional[int] = None
    vm: Optional[float] = None
    pm: Optional[float] = None
    st: Optional[float] = None
    at: Optional[float] = None
    ah: Optional[float] = None
    pump: Optional[int] = None
    vv: Optional[int] = None
    pv: Optional[int] = None
    mode: Optional[str] = None
    zone: Optional[str] = None
    err: Optional[int] = None
