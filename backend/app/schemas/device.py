from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DeviceOut(BaseModel):
    id: int
    device_id: str
    name: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None

    model_config = {"from_attributes": True}


class DeviceStatus(BaseModel):
    is_online: bool
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
