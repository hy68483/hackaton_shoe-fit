from collections.abc import AsyncGenerator

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.exceptions import api_error


class Base(DeclarativeBase):
    pass


engine = (
    create_async_engine(settings.database_url, pool_pre_ping=True)
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
        # SQLite 또는 기존 DB 테이블에 신규 컬럼(foot_side)이 누락되었을 경우를 대비한 자동 마이그레이션
        from sqlalchemy import text

        for table in ["measurement_results", "foot_profiles"]:
            try:
                await connection.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN foot_side VARCHAR(10) DEFAULT 'RIGHT'")
                )
            except Exception:
                # 이미 컬럼이 존재하거나 지원되지 않는 경우 안전하게 무시
                pass
