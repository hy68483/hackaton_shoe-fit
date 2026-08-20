import asyncio
from pathlib import Path
from uuid import UUID

import cv2
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.repositories import MeasurementRepository
from app.schemas.measurements import (
    MeasurementBatchAnalysisRequest,
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

        image_path = Path(measurement_image.original_key)
        image = cv2.imread(str(image_path))
        analysis = await asyncio.to_thread(
            self.measurement_service.analyze_foot,
            image,
            payload.point_x,
            payload.point_y,
            diagnostic_dir=image_path.parent / "diagnostics",
            diagnostic_stem=str(measurement_image.id),
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
                foot_side=str(analysis.get("foot_side") or payload.foot_side or "RIGHT"),
                segmentation_confidence=float(analysis["segmentation_confidence"]),
            ),
        )

    async def analyze_batch(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        payload: MeasurementBatchAnalysisRequest,
    ) -> dict[str, object]:
        """2~3장 측정값을 집계해 편차 보정 정보 또는 확정 측정값을 반환한다."""
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

        image_ids = [shot.image_id for shot in payload.shots]
        if len(set(image_ids)) != len(image_ids):
            raise api_error(422, "VALIDATION_ERROR", "Each batch shot must use a different image.")
        images = await self.measurement_repository.get_images_by_ids(
            measurement_id=measurement.id,
            image_ids=image_ids,
        )
        images_by_id = {image.id: image for image in images}
        if len(images_by_id) != len(image_ids):
            raise api_error(422, "VALIDATION_ERROR", "One or more images do not belong to this session.")

        analyses: list[dict[str, float | bool | str]] = []
        for shot in payload.shots:
            image_path = Path(images_by_id[shot.image_id].original_key)
            image = cv2.imread(str(image_path))
            analysis = await asyncio.to_thread(
                self.measurement_service.analyze_foot,
                image,
                shot.point_x,
                shot.point_y,
                diagnostic_dir=image_path.parent / "diagnostics",
                diagnostic_stem=str(shot.image_id),
            )
            if analysis.get("success") is False:
                raise api_error(
                    422,
                    "MEASUREMENT_ANALYSIS_FAILED",
                    "One batch image could not be analyzed.",
                    details={"image_id": str(shot.image_id), "reason": analysis["reason"]},
                )
            analyses.append(analysis)

        aggregate = self.measurement_service.aggregate_measurements(analyses)
        aggregate["individual_measurements"] = [
            {
                "image_id": str(shot.image_id),
                "foot_length_mm": analysis["foot_length_mm"],
                "foot_width_mm": analysis["foot_width_mm"],
                "foot_side": analysis.get("foot_side", "RIGHT"),
                "segmentation_confidence": analysis["segmentation_confidence"],
            }
            for shot, analysis in zip(payload.shots, analyses, strict=True)
        ]
        if bool(aggregate["retake_required"]):
            await self.measurement_repository.update_status(measurement, "RETAKE_REQUIRED")
            return aggregate

        confidence = sum(float(analysis["segmentation_confidence"]) for analysis in analyses) / len(analyses)
        batch_foot_side = str(analyses[0].get("foot_side") or (payload.shots[0].foot_side if payload.shots else "RIGHT"))
        applied = await self.measurement_result_service.apply_result(
            user_id=user_id,
            session_id=session_id,
            payload=MeasurementResultApply(
                foot_length_mm=float(aggregate["corrected_foot_length_mm"]),
                foot_width_mm=float(aggregate["corrected_foot_width_mm"]),
                foot_side=batch_foot_side,
                segmentation_confidence=confidence,
            ),
        )
        aggregate["result"] = applied.model_dump()
        return aggregate
