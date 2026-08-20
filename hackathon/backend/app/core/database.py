from collections.abc import AsyncGenerator

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.exceptions import api_error


class Base(DeclarativeBase):
    pass


engine = (
    create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args={"server_settings": {"client_encoding": "UTF8"}},
    )
    if settings.database_url
    else None
)

AsyncSessionLocal = (
    async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    if engine
    else None
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise api_error(
            503,
            "SERVICE_UNAVAILABLE",
            "DATABASE_URL is not configured.",
        )

    async with AsyncSessionLocal() as session:
        yield session


async def create_database_tables() -> None:
    if engine is None:
        return

    from app.models import (  # noqa: F401
        consent,
        foot_profile,
        measurement,
        measurement_image,
        measurement_result,
        product,
        user,
    )

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
