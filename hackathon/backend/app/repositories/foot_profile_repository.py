from decimal import Decimal
from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FootProfile


class FootProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> FootProfile | None:
        result = await self.session.execute(
            select(FootProfile).where(FootProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        *,
        user_id: UUID,
        length_mm: Decimal,
        width_mm: Decimal,
        confidence: Decimal | None,
        measurement_id: UUID | None,
        measured_at: datetime | None,
    ) -> FootProfile:
        foot_profile = await self.get_by_user_id(user_id)
        if foot_profile is None:
            foot_profile = FootProfile(user_id=user_id)
            self.session.add(foot_profile)

        foot_profile.length_mm = length_mm
        foot_profile.width_mm = width_mm
        foot_profile.confidence = confidence
        foot_profile.measurement_id = measurement_id
        foot_profile.measured_at = measured_at

        await self.session.commit()
        await self.session.refresh(foot_profile)
        return foot_profile

    async def delete_by_user_id(self, user_id: UUID) -> bool:
        result = await self.session.execute(
            delete(FootProfile).where(FootProfile.user_id == user_id)
        )
        await self.session.commit()
        return result.rowcount > 0
