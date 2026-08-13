from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Consent


class ConsentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        user_id: UUID,
        measurement_data: bool,
        image_storage: bool,
        policy_version: str,
    ) -> Consent:
        consent = Consent(
            user_id=user_id,
            measurement_data=measurement_data,
            image_storage=image_storage,
            policy_version=policy_version,
        )
        self.session.add(consent)
        await self.session.commit()
        await self.session.refresh(consent)
        return consent

    async def get_latest_by_user_id(self, user_id: UUID) -> Consent | None:
        result = await self.session.execute(
            select(Consent)
            .where(Consent.user_id == user_id)
            .order_by(Consent.agreed_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_active_by_id_for_user(
        self,
        *,
        consent_id: UUID,
        user_id: UUID,
    ) -> Consent | None:
        result = await self.session.execute(
            select(Consent).where(
                Consent.id == consent_id,
                Consent.user_id == user_id,
                Consent.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def revoke_active_by_user_id(self, user_id: UUID) -> bool:
        consent = await self.get_latest_by_user_id(user_id)
        if consent is None or consent.revoked_at is not None:
            return False

        consent.revoked_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(consent)
        return True
