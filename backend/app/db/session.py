from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_all_tables() -> None:
    # Import all models so metadata is populated
    import app.models.user  # noqa
    import app.models.device  # noqa
    import app.models.sensor_reading  # noqa
    import app.models.irrigation_session  # noqa
    import app.models.device_command  # noqa
    import app.models.notification  # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
