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

    # Normalize compact aliases if standard fields were not populated
    veg_moist = packet.veg_moisture if packet.veg_moisture is not None else packet.vm
    paddy_moist = packet.paddy_moisture if packet.paddy_moisture is not None else packet.pm
    ph_val = packet.ph
    soil_temperature = packet.soil_temp if packet.soil_temp is not None else packet.st
    air_temperature = packet.air_temp if packet.air_temp is not None else packet.at
    air_humid = packet.air_humidity if packet.air_humidity is not None else packet.ah
    pump_act = packet.pump_active or bool(packet.pump)
    veg_v = packet.veg_valve or bool(packet.vv)
    paddy_v = packet.paddy_valve or bool(packet.pv)
    irrig_mode = packet.irrigation_mode or packet.mode
    act_zone = packet.active_zone or packet.zone
    err_bits = packet.error_bitmask or (packet.err if packet.err is not None else 0)

    # Save sensor reading
    reading = SensorReading(
        device_id=device_id,
        timestamp=datetime.now(timezone.utc),
        veg_moisture=veg_moist,
        paddy_moisture=paddy_moist,
        ph=ph_val,
        soil_temp=soil_temperature,
        air_temp=air_temperature,
        air_humidity=air_humid,
        pump_active=pump_act,
        veg_valve=veg_v,
        paddy_valve=paddy_v,
        irrigation_mode=irrig_mode,
        active_zone=act_zone,
        error_bitmask=err_bits,
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
