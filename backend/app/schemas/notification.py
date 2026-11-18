from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    category: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
