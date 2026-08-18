from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import Measurement
from app.repositories import ConsentRepository, MeasurementRepository
from app.schemas.measurements import MeasurementSessionCreate, MeasurementSessionRead


class MeasurementSessionService:
    def __init__(self, session: AsyncSession) -> None:
        self.consent_repository = ConsentRepository(session)
        self.measurement_repository = MeasurementRepository(session)

    async def create_session(
        self,
        user_id: UUID,
        payload: MeasurementSessionCreate,
    ) -> MeasurementSessionRead:
        consent = await self.consent_repository.get_active_by_id_for_user(
            consent_id=payload.consent_id,
            user_id=user_id,
        )
        if consent is None:
            raise api_error(
                404,
                "NOT_FOUND",
                "Active consent not found.",
                field="consent_id",
            )

        measurement = await self.measurement_repository.create_session(
            user_id=user_id,
            consent_id=payload.consent_id,
        )
        return self._to_session_read(measurement)

    async def get_session(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
    ) -> MeasurementSessionRead:
        measurement = await self.measurement_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")
        return self._to_session_read(measurement)

    async def discard_session(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
    ) -> MeasurementSessionRead:
        measurement = await self.measurement_repository.discard_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")
        return self._to_session_read(measurement)

    def _to_session_read(self, measurement: Measurement) -> MeasurementSessionRead:
        return MeasurementSessionRead(
            session_id=str(measurement.session_id),
            consent_id=str(measurement.consent_id),
            status=measurement.status,
            confidence=(
                float(measurement.confidence)
                if measurement.confidence is not None
                else None
            ),
            created_at=measurement.created_at,
            updated_at=measurement.updated_at,
        )
