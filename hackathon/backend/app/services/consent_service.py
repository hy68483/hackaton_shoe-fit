from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Consent
from app.repositories import ConsentRepository
from app.schemas.consents import ConsentCreate, ConsentRead


class ConsentService:
    def __init__(self, session: AsyncSession) -> None:
        self.consent_repository = ConsentRepository(session)

    async def create_consent(
        self,
        user_id: UUID,
        payload: ConsentCreate,
    ) -> ConsentRead:
        consent = await self.consent_repository.create(
            user_id=user_id,
            measurement_data=payload.measurement_data,
            image_storage=payload.image_storage,
            policy_version=payload.policy_version,
        )
        return self._to_consent_read(consent)

    async def get_my_consent(self, user_id: UUID) -> ConsentRead | None:
        consent = await self.consent_repository.get_latest_by_user_id(user_id)
        if consent is None:
            return None
        return self._to_consent_read(consent)

    async def revoke_my_consent(self, user_id: UUID) -> bool:
        return await self.consent_repository.revoke_active_by_user_id(user_id)

    def _to_consent_read(self, consent: Consent) -> ConsentRead:
        return ConsentRead(
            id=str(consent.id),
            measurement_data=consent.measurement_data,
            image_storage=consent.image_storage,
            policy_version=consent.policy_version,
            agreed_at=consent.agreed_at,
            revoked_at=consent.revoked_at,
        )
