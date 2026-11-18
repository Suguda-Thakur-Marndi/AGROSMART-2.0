import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device_command import DeviceCommand


async def dispatch_command(
    db: AsyncSession,
    device_id: str,
    command_type: str,
    payload: Optional[Dict[str, Any]] = None,
) -> DeviceCommand:
    cmd = DeviceCommand(
        device_id=device_id,
        command_type=command_type,
        payload_json=json.dumps(payload) if payload else None,
        issued_at=datetime.now(timezone.utc),
        status="pending",
    )
    db.add(cmd)
    await db.commit()
    await db.refresh(cmd)
    return cmd


async def get_pending_commands(db: AsyncSession, device_id: str) -> List[DeviceCommand]:
    result = await db.execute(
        select(DeviceCommand)
        .where(DeviceCommand.device_id == device_id, DeviceCommand.status == "pending")
        .order_by(DeviceCommand.issued_at)
    )
    return list(result.scalars().all())


async def mark_executed(db: AsyncSession, cmd_id: int) -> Optional[DeviceCommand]:
    result = await db.execute(select(DeviceCommand).where(DeviceCommand.id == cmd_id))
    cmd = result.scalar_one_or_none()
    if cmd:
        cmd.status = "executed"
        cmd.executed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(cmd)
    return cmd
