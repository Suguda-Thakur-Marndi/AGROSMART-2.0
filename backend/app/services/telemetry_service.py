from datetime import datetime, timezone
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.device import Device
from app.models.notification import Notification
from app.models.sensor_reading import SensorReading
from app.schemas.sensor import TelemetryPacket

logger = logging.getLogger("agrosmart.telemetry")


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

    # Threshold and event notifications
    notifications = []

    # Vegetable zone moisture alerts
    if veg_moist is not None and veg_moist >= 0:
        if veg_moist < settings.VEG_MOISTURE_ON:
            notifications.append(Notification(
                title="Low Vegetable Moisture",
                body=f"Vegetable zone moisture is {veg_moist:.1f}% — below threshold {settings.VEG_MOISTURE_ON}%",
                category="moisture_alert",
            ))
        elif veg_moist > settings.VEG_MOISTURE_OFF:
            notifications.append(Notification(
                title="Vegetable Moisture Sufficient",
                body=f"Vegetable zone moisture is {veg_moist:.1f}% — target reached",
                category="moisture_ok",
            ))

    # Paddy zone moisture alerts (if physical probe installed, >= 0)
    if paddy_moist is not None and paddy_moist >= 0:
        if paddy_moist < settings.PADDY_MOISTURE_ON:
            notifications.append(Notification(
                title="Low Paddy Moisture",
                body=f"Paddy zone moisture is {paddy_moist:.1f}% — below threshold {settings.PADDY_MOISTURE_ON}%",
                category="moisture_alert",
            ))
        elif paddy_moist > settings.PADDY_MOISTURE_OFF:
            notifications.append(Notification(
                title="Paddy Moisture Sufficient",
                body=f"Paddy zone moisture is {paddy_moist:.1f}% — target reached",
                category="moisture_ok",
            ))

    # pH anomaly warnings (optimal 5.5 - 7.5)
    if ph_val is not None and ph_val > 0:
        if ph_val < 5.5:
            notifications.append(Notification(
                title="Acidic Soil Alert",
                body=f"Soil pH dropped to {ph_val:.2f} — below healthy threshold 5.50 pH",
                category="ph_alert",
            ))
        elif ph_val > 7.5:
            notifications.append(Notification(
                title="Alkaline Soil Alert",
                body=f"Soil pH elevated to {ph_val:.2f} — above healthy threshold 7.50 pH",
                category="ph_alert",
            ))

    # Hardware fault bitmask alerts
    if err_bits != 0:
        fault_msgs = []
        if err_bits & 0x01: fault_msgs.append("Veg Moisture Sensor Fault")
        if err_bits & 0x02: fault_msgs.append("Paddy Moisture Sensor Fault")
        if err_bits & 0x04: fault_msgs.append("pH Electrode Signal Fault")
        if err_bits & 0x08: fault_msgs.append("DS18B20 Temp Probe Fault")
        if err_bits & 0x10: fault_msgs.append("DHT11 Sensor Timeout")
        if err_bits & 0x40: fault_msgs.append("Pump Max Runtime Timeout Exceeded")
        if err_bits & 0x80: fault_msgs.append("Emergency Stop Active")
        
        detail = ", ".join(fault_msgs) if fault_msgs else f"Bitmask 0x{err_bits:02X}"
        notifications.append(Notification(
            title="Hardware Safety Alert",
            body=f"Device {device_id} reported: {detail}",
            category="error",
        ))

    for n in notifications:
        db.add(n)

    await db.commit()
    await db.refresh(reading)

    # Broadcast real-time telemetry over WebSockets to connected mobile clients
    try:
        from app.api.v1.websocket import manager
        await manager.broadcast(device_id, {
            "type": "telemetry",
            "device_id": device_id,
            "data": {
                "id": reading.id,
                "timestamp": reading.timestamp.isoformat(),
                "veg_moisture": reading.veg_moisture,
                "paddy_moisture": reading.paddy_moisture,
                "ph": reading.ph,
                "soil_temp": reading.soil_temp,
                "air_temp": reading.air_temp,
                "air_humidity": reading.air_humidity,
                "pump_active": reading.pump_active,
                "veg_valve": reading.veg_valve,
                "paddy_valve": reading.paddy_valve,
                "irrigation_mode": reading.irrigation_mode,
                "active_zone": reading.active_zone,
                "error_bitmask": reading.error_bitmask,
            }
        })
    except Exception as e:
        logger.warning(f"WebSocket broadcast exception for {device_id}: {e}")

    return reading
