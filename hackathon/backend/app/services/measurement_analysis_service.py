from pathlib import Path
from uuid import UUID

import cv2
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.repositories import MeasurementRepository
from app.schemas.measurements import (
    MeasurementAnalysisRequest,
    MeasurementResultApply,
    MeasurementResultRead,
)
from app.services.measurement_result_service import MeasurementResultService
from app.services.measurement_service import MeasurementService


class MeasurementAnalysisService:
    def __init__(self, session: AsyncSession) -> None:
        self.measurement_repository = MeasurementRepository(session)
        self.measurement_result_service = MeasurementResultService(session)
        self.measurement_service = MeasurementService()

    async def analyze(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        payload: MeasurementAnalysisRequest,
    ) -> MeasurementResultRead:
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

        image = cv2.imread(str(Path(measurement_image.original_key)))
        analysis = self.measurement_service.analyze_foot(
            image,
            point_x=payload.point_x,
            point_y=payload.point_y,
        )
        if analysis.get("success") is False:
            raise api_error(
                422,
                "MEASUREMENT_ANALYSIS_FAILED",
                "Foot measurement analysis could not be completed.",
                details={"reason": analysis["reason"]},
            )

        return await self.measurement_result_service.apply_result(
            user_id=user_id,
            session_id=session_id,
            payload=MeasurementResultApply(
                foot_length_mm=float(analysis["foot_length_mm"]),
                foot_width_mm=float(analysis["foot_width_mm"]),
                segmentation_confidence=float(analysis["segmentation_confidence"]),
            ),
        )
