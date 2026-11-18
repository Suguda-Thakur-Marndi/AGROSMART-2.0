from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.schemas.device import DeviceOut, DeviceStatus
from app.services.irrigation_service import get_pending_commands, mark_executed

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=List[DeviceOut])
async def list_devices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device))
    return list(result.scalars().all())


@router.get("/{device_id}", response_model=DeviceOut)
async def get_device(device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}/status", response_model=DeviceOut)
async def update_device_status(
    device_id: str,
    payload: DeviceStatus,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_online = payload.is_online
    device.last_seen = datetime.now(timezone.utc)
    if payload.firmware_version:
        device.firmware_version = payload.firmware_version
    if payload.ip_address:
        device.ip_address = payload.ip_address
    await db.commit()
    await db.refresh(device)
    return device


@router.get("/{device_id}/commands")
async def poll_commands(device_id: str, db: AsyncSession = Depends(get_db)):
    cmds = await get_pending_commands(db, device_id)
    import json
    return [
        {
            "id": c.id,
            "command_type": c.command_type,
            "payload": json.loads(c.payload_json) if c.payload_json else None,
            "issued_at": c.issued_at.isoformat(),
        }
        for c in cmds
    ]


@router.post("/{device_id}/commands/executed/{cmd_id}", status_code=status.HTTP_200_OK)
async def mark_command_executed(device_id: str, cmd_id: int, db: AsyncSession = Depends(get_db)):
    cmd = await mark_executed(db, cmd_id)
    if not cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    return {"status": "executed", "cmd_id": cmd_id}
