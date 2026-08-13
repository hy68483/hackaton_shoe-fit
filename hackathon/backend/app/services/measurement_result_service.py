from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import Measurement, MeasurementResult
from app.repositories import FootProfileRepository, MeasurementRepository
from app.schemas.measurements import MeasurementResultApply, MeasurementResultRead


class MeasurementResultService:
    def __init__(self, session: AsyncSession) -> None:
        self.foot_profile_repository = FootProfileRepository(session)
        self.measurement_repository = MeasurementRepository(session)

    async def apply_result(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        payload: MeasurementResultApply,
    ) -> MeasurementResultRead:
        measurement = await self._get_active_session(user_id=user_id, session_id=session_id)
        if measurement.status not in {"SEGMENTING", "COMPLETED"}:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Image validation is required before applying measurement results.",
                details={"status": measurement.status},
            )

        confidence = (
            Decimal(str(payload.segmentation_confidence))
            if payload.segmentation_confidence is not None
            else None
        )
        result = await self.measurement_repository.upsert_result(
            measurement=measurement,
            foot_length_mm=Decimal(str(payload.foot_length_mm)),
            foot_width_mm=Decimal(str(payload.foot_width_mm)),
            segmentation_confidence=confidence,
        )
        await self.foot_profile_repository.upsert(
            user_id=user_id,
            length_mm=result.foot_length_mm,
            width_mm=result.foot_width_mm,
            confidence=result.segmentation_confidence,
            measurement_id=measurement.id,
            measured_at=result.measured_at,
        )
        return self._to_result_read(measurement, result)

    async def get_result(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
    ) -> MeasurementResultRead:
        measurement = await self._get_active_session(user_id=user_id, session_id=session_id)
        result = await self.measurement_repository.get_result(measurement.id)
        if result is None:
            raise api_error(404, "NOT_FOUND", "Measurement result not found.")
        return self._to_result_read(measurement, result)

    async def _get_active_session(self, *, user_id: UUID, session_id: UUID) -> Measurement:
        measurement = await self.measurement_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")
        if measurement.discarded_at is not None or measurement.status == "DISCARDED":
            raise api_error(409, "BUSINESS_RULE_VIOLATION", "Measurement session is discarded.")
        return measurement

    def _to_result_read(
        self,
        measurement: Measurement,
        result: MeasurementResult,
    ) -> MeasurementResultRead:
        return MeasurementResultRead(
            result_id=str(result.id),
            session_id=str(measurement.session_id),
            foot_length_mm=float(result.foot_length_mm),
            foot_width_mm=float(result.foot_width_mm),
            segmentation_confidence=(
                float(result.segmentation_confidence)
                if result.segmentation_confidence is not None
                else None
            ),
            status=measurement.status,
            measured_at=result.measured_at,
        )
