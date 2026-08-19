"""한쪽 발의 SAM 분할과 OpenCV 측정을 연결하는 파이프라인이다."""

from __future__ import annotations

from statistics import median
from typing import Iterable

import numpy as np

from app.core.config import settings

from .camera_calibration import CameraCalibration
from .opencv_service import ImageValidationError, MeasurementError, OpenCVService
from .sam_service import SAMService, SegmentationError


class MeasurementService:
    # 3장 촬영 기준으로 이 범위를 넘으면, 평균값을 최종 길이로 확정하지 않는다.
    MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM = 5.0
    MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM = 3.0

    def __init__(self, sam_service: SAMService | None = None, opencv_service: OpenCVService | None = None) -> None:
        # 테스트에서는 가짜 서비스 주입이 가능하고, 기본 실행은 실제 서비스로 구성한다.
        self.sam_service = sam_service or SAMService(model_path=settings.sam_model_path or None)
        calibration = (
            CameraCalibration.from_file(settings.camera_calibration_path)
            if settings.camera_calibration_path
            else None
        )
        self.opencv_service = opencv_service or OpenCVService(camera_calibration=calibration)

    def analyze_foot(self, image: np.ndarray, point_x: int, point_y: int) -> dict[str, float | bool | str]:
        """한쪽 발의 mm 치수 또는 문서화된 실패 코드를 반환한다."""
        # 유효하지 않은 사진은 SAM 추론과 치수 계산을 수행하지 않는다.
        validation = self.opencv_service.validate_image(image)
        if not validation["valid"]:
            return {"success": False, "reason": validation["reason"]}
        try:
            # 사용자 선택 좌표로 발 mask를 만들고, 원근 보정 후 치수를 계산한다.
            segmentation = self.sam_service.segment(
                image,
                point_x,
                point_y,
                negative_point=self.opencv_service.lower_leg_negative_point(image),
            )
            corrected = self.opencv_service.correct_perspective(image, segmentation["mask"])
            dimensions = {
                **self.opencv_service.measure_mask(corrected["mask"], corrected["scale_mm_per_px"]),
                "parallax_correction_applied": False,
            }
            pose = self.opencv_service.estimate_camera_pose(image)
            if pose is not None:
                try:
                    dimensions = self.opencv_service.measure_mask_with_parallax(
                        corrected["mask"],
                        corrected["matrix"],
                        pose,
                    )
                except MeasurementError:
                    dimensions["parallax_correction_reason"] = "BACKPROJECTION_FAILED"
            elif self.opencv_service.camera_calibration is not None:
                dimensions["parallax_correction_reason"] = "POSE_UNAVAILABLE"
        except SegmentationError:
            # checkpoint·추론·mask 오류를 하나의 공개 실패 코드로 정규화한다.
            return {"success": False, "reason": "SEGMENTATION_FAILED"}
        except ImageValidationError:
            # 검증을 통과했더라도 보정 단계에서 실패할 가능성을 별도 처리한다.
            return {"success": False, "reason": "PERSPECTIVE_FAILED"}
        except MeasurementError:
            # contour가 없거나 길이·발볼을 계산할 수 없으면 측정 실패를 반환한다.
            return {"success": False, "reason": "MEASUREMENT_FAILED"}
        
        foot_side = self.opencv_service.detect_foot_side(
            corrected["mask"],
            corrected.get("transformed_reference_points"),
        )
        return {
            **dimensions,
            "foot_side": foot_side,
            "segmentation_confidence": float(segmentation["segmentation_confidence"]),
        }

    @classmethod
    def aggregate_measurements(
        cls,
        measurements: Iterable[dict[str, float | bool | str]],
    ) -> dict[str, float | bool | int | str]:
        """여러 장의 측정 결과를 집계하고, 편차가 크면 보정 정보를 반환한다.

        촬영 각도나 SAM의 뒤꿈치 경계가 달라질 수 있으므로, 길이 편차가 임계치를
        초과한 경우 산술 평균 대신 중앙값을 ``corrected_foot_length_mm``으로 제공한다.
        이 값은 재촬영이 필요한 상태임을 함께 알려 주는 임시 대표값이며, 사용자에게
        정확한 최종 측정값처럼 확정해서는 안 된다.
        """
        successful = [result for result in measurements if result.get("success") is not False]
        if len(successful) < 2:
            raise ValueError("At least two successful measurements are required.")

        try:
            lengths = [float(result["foot_length_mm"]) for result in successful]
            widths = [float(result["foot_width_mm"]) for result in successful]
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError("Measurements must include numeric foot_length_mm and foot_width_mm.") from error

        length_average = float(np.mean(lengths))
        width_average = float(np.mean(widths))
        length_median = float(median(lengths))
        width_median = float(median(widths))
        length_spread = max(lengths) - min(lengths)
        width_spread = max(widths) - min(widths)
        length_correction_required = length_spread > cls.MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM
        width_correction_required = width_spread > cls.MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM

        corrected_length = length_median if length_correction_required else length_average
        corrected_width = width_median if width_correction_required else width_average

        return {
            "measurement_count": len(successful),
            "raw_average_foot_length_mm": round(length_average, 1),
            "raw_average_foot_width_mm": round(width_average, 1),
            "corrected_foot_length_mm": round(corrected_length, 1),
            "corrected_foot_width_mm": round(corrected_width, 1),
            "length_correction_mm": round(corrected_length - length_average, 1),
            "width_correction_mm": round(corrected_width - width_average, 1),
            "length_spread_mm": round(length_spread, 1),
            "width_spread_mm": round(width_spread, 1),
            "correction_applied": length_correction_required or width_correction_required,
            "retake_required": length_correction_required,
            "correction_reason": (
                "LENGTH_SPREAD_EXCEEDED"
                if length_correction_required
                else "WIDTH_SPREAD_EXCEEDED"
                if width_correction_required
                else "NONE"
            ),
        }
