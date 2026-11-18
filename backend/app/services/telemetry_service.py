from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.device import Device
from app.models.notification import Notification
from app.models.sensor_reading import SensorReading
from app.schemas.sensor import TelemetryPacket
from sqlalchemy import select


async def ingest_telemetry(db: AsyncSession, device_id: str, packet: TelemetryPacket) -> SensorReading:
    # Upsert device record
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()

    if device is None:
        device = Device(
            device_id=device_id,
            name=f"Device {device_id}",
            is_online=True,
            last_seen=datetime.now(timezone.utc),
            firmware_version=packet.firmware_version,
            ip_address=packet.ip_address,
        )
        db.add(device)
    else:
        device.is_online = True
        device.last_seen = datetime.now(timezone.utc)
        if packet.firmware_version:
            device.firmware_version = packet.firmware_version
        if packet.ip_address:
            device.ip_address = packet.ip_address

    # Save sensor reading
    reading = SensorReading(
        device_id=device_id,
        timestamp=datetime.now(timezone.utc),
        veg_moisture=packet.veg_moisture,
        paddy_moisture=packet.paddy_moisture,
        ph=packet.ph,
        soil_temp=packet.soil_temp,
        air_temp=packet.air_temp,
        air_humidity=packet.air_humidity,
        pump_active=packet.pump_active,
        veg_valve=packet.veg_valve,
        paddy_valve=packet.paddy_valve,
        irrigation_mode=packet.irrigation_mode,
        active_zone=packet.active_zone,
        error_bitmask=packet.error_bitmask,
    )
    db.add(reading)

    # Threshold notifications
    notifications = []

    if packet.veg_moisture is not None:
        if packet.veg_moisture < settings.VEG_MOISTURE_ON:
            notifications.append(Notification(
                title="Low Veggie Moisture",
                body=f"Veg zone moisture is {packet.veg_moisture:.1f}% — below threshold {settings.VEG_MOISTURE_ON}%",
                category="moisture_alert",
            ))
        elif packet.veg_moisture > settings.VEG_MOISTURE_OFF:
            notifications.append(Notification(
                title="Veg Moisture Sufficient",
                body=f"Veg zone moisture is {packet.veg_moisture:.1f}% — irrigation can stop",
                category="moisture_ok",
            ))

    if packet.paddy_moisture is not None:
        if packet.paddy_moisture < settings.PADDY_MOISTURE_ON:
            notifications.append(Notification(
                title="Low Paddy Moisture",
                body=f"Paddy zone moisture is {packet.paddy_moisture:.1f}% — below threshold {settings.PADDY_MOISTURE_ON}%",
                category="moisture_alert",
            ))
        elif packet.paddy_moisture > settings.PADDY_MOISTURE_OFF:
            notifications.append(Notification(
                title="Paddy Moisture Sufficient",
                body=f"Paddy zone moisture is {packet.paddy_moisture:.1f}% — irrigation can stop",
                category="moisture_ok",
            ))

    if packet.error_bitmask and packet.error_bitmask != 0:
        notifications.append(Notification(
            title="Device Error",
            body=f"Device {device_id} reported error bitmask: {packet.error_bitmask}",
            category="error",
        ))

    for n in notifications:
        db.add(n)

    await db.commit()
    await db.refresh(reading)
    return reading
