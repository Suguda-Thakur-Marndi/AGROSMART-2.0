from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IrrigationSession(Base):
    __tablename__ = "irrigation_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    zone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_volume_liters_est: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trigger_moisture_start: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trigger_moisture_end: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
