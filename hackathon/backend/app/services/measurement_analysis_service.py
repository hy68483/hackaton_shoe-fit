from pathlib import Path
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.repositories import MeasurementRepository
from app.schemas.measurements import MeasurementAnalysisRequest
from app.services.measurement_service import MeasurementService


class MeasurementAnalysisService:
    def __init__(self, session: AsyncSession) -> None:
        self.measurement_repository = MeasurementRepository(session)
        self.measurement_service = MeasurementService()

    async def analyze(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        payload: MeasurementAnalysisRequest,
    ) -> None:
        measurement = await self.measurement_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")
        if measurement.status == "DISCARDED" or measurement.discarded_at is not None:
            raise api_error(409, "BUSINESS_RULE_VIOLATION", "Measurement session is discarded.")
        if measurement.status != "SEGMENTING":
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Image validation is required before analysis.",
                details={"status": measurement.status},
            )

        measurement_image = await self.measurement_repository.get_latest_image(measurement.id)
        if measurement_image is None:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Measurement image must be uploaded before analysis.",
            )

        try:
            await self.measurement_service.analyze_foot(
                Path(measurement_image.original_key),
                point_x=payload.point_x,
                point_y=payload.point_y,
            )
        except NotImplementedError as exc:
            raise api_error(
                501,
                "NOT_IMPLEMENTED",
                "SAM/OpenCV measurement analysis is not implemented yet.",
                details={
                    "session_id": str(session_id),
                    "image_id": str(measurement_image.id),
                    "point_x": payload.point_x,
                    "point_y": payload.point_y,
                },
            ) from exc
