from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Measurement


class MeasurementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_session(
        self,
        *,
        user_id: UUID,
        consent_id: UUID,
    ) -> Measurement:
        measurement = Measurement(user_id=user_id, consent_id=consent_id)
        self.session.add(measurement)
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement

    async def get_session_for_user(
        self,
        *,
        session_id: UUID,
        user_id: UUID,
    ) -> Measurement | None:
        result = await self.session.execute(
            select(Measurement).where(
                Measurement.session_id == session_id,
                Measurement.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def discard_session_for_user(
        self,
        *,
        session_id: UUID,
        user_id: UUID,
    ) -> Measurement | None:
        measurement = await self.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            return None

        measurement.status = "DISCARDED"
        measurement.discarded_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement
