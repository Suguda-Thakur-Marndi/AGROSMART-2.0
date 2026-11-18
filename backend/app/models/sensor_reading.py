from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    veg_moisture: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    paddy_moisture: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_temp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    air_temp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    air_humidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pump_active: Mapped[bool] = mapped_column(Boolean, default=False)
    veg_valve: Mapped[bool] = mapped_column(Boolean, default=False)
    paddy_valve: Mapped[bool] = mapped_column(Boolean, default=False)
    irrigation_mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    active_zone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_bitmask: Mapped[int] = mapped_column(Integer, default=0)
