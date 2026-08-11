from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FootProfile
from app.repositories import FootProfileRepository
from app.schemas.profiles import FootProfileApply, FootProfileRead


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.foot_profile_repository = FootProfileRepository(session)

    async def get_foot_profile(self, user_id: UUID) -> FootProfileRead | None:
        foot_profile = await self.foot_profile_repository.get_by_user_id(user_id)
        if foot_profile is None:
            return None
        return self._to_foot_profile_read(foot_profile)

    async def apply_foot_profile(
        self,
        user_id: UUID,
        payload: FootProfileApply,
    ) -> FootProfileRead:
        foot_profile = await self.foot_profile_repository.upsert(
            user_id=user_id,
            length_mm=Decimal(str(payload.foot_length_mm)),
            width_mm=Decimal(str(payload.foot_width_mm)),
            confidence=(
                Decimal(str(payload.confidence))
                if payload.confidence is not None
                else None
            ),
            measurement_id=payload.measurement_id,
            measured_at=payload.measured_at,
        )
        return self._to_foot_profile_read(foot_profile)

    async def delete_foot_profile(self, user_id: UUID) -> bool:
        return await self.foot_profile_repository.delete_by_user_id(user_id)

    def _to_foot_profile_read(self, foot_profile: FootProfile) -> FootProfileRead:
        return FootProfileRead(
            foot_length_mm=float(foot_profile.length_mm),
            foot_width_mm=float(foot_profile.width_mm),
            confidence=(
                float(foot_profile.confidence)
                if foot_profile.confidence is not None
                else None
            ),
            measurement_id=(
                str(foot_profile.measurement_id)
                if foot_profile.measurement_id is not None
                else None
            ),
            measured_at=foot_profile.measured_at,
        )
