from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
async def list_notifications(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_read(db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).values(is_read=True))
    await db.commit()
    return {"status": "ok", "message": "All notifications marked as read"}


@router.put("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(notification_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif
