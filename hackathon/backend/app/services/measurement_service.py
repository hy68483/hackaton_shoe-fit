"""한쪽 발의 SAM 분할과 OpenCV 측정을 연결하는 파이프라인이다."""

from __future__ import annotations

import json
from itertools import combinations
from pathlib import Path
from statistics import median
from typing import Iterable

import cv2
import numpy as np

from app.core.config import settings

from .camera_calibration import CameraCalibration
from .opencv_service import ImageValidationError, MeasurementError, OpenCVService
from .sam_service import SAMService, SegmentationError


class MeasurementService:
    # 3장 촬영 기준으로 이 범위를 넘으면, 평균값을 최종 길이로 확정하지 않는다.
    MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM = 5.0
    MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM = 3.0
    MIN_PLAUSIBLE_FOOT_LENGTH_MM = 180.0
    MAX_PLAUSIBLE_FOOT_LENGTH_MM = 330.0
    MIN_PLAUSIBLE_FOOT_WIDTH_MM = 60.0
    MAX_PLAUSIBLE_FOOT_WIDTH_MM = 140.0
    MIN_PLAUSIBLE_WIDTH_RATIO = 0.25
    MAX_PLAUSIBLE_WIDTH_RATIO = 0.55

    def __init__(self, sam_service: SAMService | None = None, opencv_service: OpenCVService | None = None) -> None:
        # 테스트에서는 가짜 서비스 주입이 가능하고, 기본 실행은 실제 서비스로 구성한다.
        self.sam_service = sam_service or SAMService(model_path=settings.sam_model_path or None)
        calibration = (
            CameraCalibration.from_file(settings.camera_calibration_path)
            if settings.camera_calibration_path
            else None
        )
        self.opencv_service = opencv_service or OpenCVService(camera_calibration=calibration)

    def analyze_foot(
        self,
        image: np.ndarray,
        point_x: int,
        point_y: int,
        *,
        diagnostic_dir: Path | None = None,
        diagnostic_stem: str = "measurement",
    ) -> dict[str, float | bool | str]:
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

            if diagnostic_dir is not None:
                self._save_diagnostics(
                    diagnostic_dir=diagnostic_dir,
                    diagnostic_stem=diagnostic_stem,
                    image=image,
                    point_x=point_x,
                    point_y=point_y,
                    mask=segmentation["mask"],
                    corrected_mask=corrected["mask"],
                    dimensions=dimensions,
                    confidence=float(segmentation["segmentation_confidence"]),
                )
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

    @staticmethod
    def _save_diagnostics(
        *,
        diagnostic_dir: Path,
        diagnostic_stem: str,
        image: np.ndarray,
        point_x: int,
        point_y: int,
        mask: np.ndarray,
        corrected_mask: np.ndarray,
        dimensions: dict[str, float | bool | str],
        confidence: float,
    ) -> None:
        diagnostic_dir.mkdir(parents=True, exist_ok=True)
        binary_mask = (mask > 0).astype(np.uint8) * 255
        corrected_binary_mask = (corrected_mask > 0).astype(np.uint8) * 255

        overlay = image.copy()
        selected = binary_mask > 0
        overlay[selected] = (
            overlay[selected].astype(np.float32) * 0.45
            + np.array([40, 220, 40], dtype=np.float32) * 0.55
        ).astype(np.uint8)
        cv2.circle(overlay, (point_x, point_y), 12, (0, 0, 255), 3)

        cv2.imwrite(str(diagnostic_dir / f"{diagnostic_stem}-mask.png"), binary_mask)
        cv2.imwrite(
            str(diagnostic_dir / f"{diagnostic_stem}-corrected-mask.png"),
            corrected_binary_mask,
        )
        cv2.imwrite(str(diagnostic_dir / f"{diagnostic_stem}-overlay.jpg"), overlay)
        metadata = {
            "point_x": point_x,
            "point_y": point_y,
            "segmentation_confidence": confidence,
            **dimensions,
        }
        (diagnostic_dir / f"{diagnostic_stem}-measurement.json").write_text(
            json.dumps(metadata, ensure_ascii=True, indent=2),
            encoding="utf-8",
        )

    @classmethod
    def is_plausible_measurement(cls, length_mm: float, width_mm: float) -> bool:
        """명백한 분할·원근 보정 실패값이 최종 결과로 저장되지 않게 한다."""
        if not np.isfinite(length_mm) or not np.isfinite(width_mm):
            return False
        if not (
            cls.MIN_PLAUSIBLE_FOOT_LENGTH_MM
            <= length_mm
            <= cls.MAX_PLAUSIBLE_FOOT_LENGTH_MM
        ):
            return False
        if not (
            cls.MIN_PLAUSIBLE_FOOT_WIDTH_MM
            <= width_mm
            <= cls.MAX_PLAUSIBLE_FOOT_WIDTH_MM
        ):
            return False
        width_ratio = width_mm / length_mm
        return (
            cls.MIN_PLAUSIBLE_WIDTH_RATIO
            <= width_ratio
            <= cls.MAX_PLAUSIBLE_WIDTH_RATIO
        )

    @classmethod
    def aggregate_measurements(
        cls,
        measurements: Iterable[dict[str, float | bool | str]],
    ) -> dict[str, object]:
        """합의하는 측정값을 집계하고 단독 이상치는 최종 결과에서 제외한다."""
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
        plausible_indices = [
            index
            for index, (length, width) in enumerate(zip(lengths, widths, strict=True))
            if cls.is_plausible_measurement(length, width)
        ]
        implausible_indices = [
            index for index in range(len(successful)) if index not in plausible_indices
        ]
        plausible_lengths = [lengths[index] for index in plausible_indices]
        plausible_widths = [widths[index] for index in plausible_indices]
        plausible_length_spread = (
            max(plausible_lengths) - min(plausible_lengths)
            if len(plausible_lengths) >= 2
            else float("inf")
        )
        plausible_width_spread = (
            max(plausible_widths) - min(plausible_widths)
            if len(plausible_widths) >= 2
            else float("inf")
        )
        all_consistent = (
            len(plausible_indices) >= 2
            and plausible_length_spread <= cls.MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM
            and plausible_width_spread <= cls.MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM
        )
        agreeing_pairs: list[tuple[float, int, int]] = []
        for first, second in combinations(plausible_indices, 2):
            length_difference = abs(lengths[first] - lengths[second])
            width_difference = abs(widths[first] - widths[second])
            if (
                length_difference <= cls.MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM
                and width_difference <= cls.MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM
            ):
                normalized_difference = (
                    length_difference / cls.MAX_MULTI_CAPTURE_LENGTH_SPREAD_MM
                    + width_difference / cls.MAX_MULTI_CAPTURE_WIDTH_SPREAD_MM
                )
                agreeing_pairs.append((normalized_difference, first, second))

        if all_consistent:
            accepted_indices = plausible_indices
            corrected_length = float(median(plausible_lengths))
            corrected_width = float(median(plausible_widths))
        elif agreeing_pairs:
            _, first, second = min(agreeing_pairs)
            accepted_indices = [first, second]
            corrected_length = float(np.mean([lengths[first], lengths[second]]))
            corrected_width = float(np.mean([widths[first], widths[second]]))
        else:
            accepted_indices = []
            corrected_length = length_median
            corrected_width = width_median

        excluded_indices = [
            index for index in range(len(successful)) if index not in accepted_indices
        ]
        retake_required = not accepted_indices
        outlier_rejected = bool(excluded_indices) and not retake_required
        correction_applied = (
            outlier_rejected
            or retake_required
            or abs(corrected_length - length_average) >= 0.05
            or abs(corrected_width - width_average) >= 0.05
        )
        accepted_length_spread = (
            max(lengths[index] for index in accepted_indices)
            - min(lengths[index] for index in accepted_indices)
            if accepted_indices
            else length_spread
        )
        accepted_width_spread = (
            max(widths[index] for index in accepted_indices)
            - min(widths[index] for index in accepted_indices)
            if accepted_indices
            else width_spread
        )

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
            "accepted_length_spread_mm": round(accepted_length_spread, 1),
            "accepted_width_spread_mm": round(accepted_width_spread, 1),
            "accepted_measurement_indices": accepted_indices,
            "excluded_measurement_indices": excluded_indices,
            "implausible_measurement_indices": implausible_indices,
            "aggregation_method": (
                "MEDIAN"
                if all_consistent
                else "CLOSEST_PAIR_MEAN"
                if accepted_indices
                else "NONE"
            ),
            "outlier_rejected": outlier_rejected,
            "correction_applied": correction_applied,
            "retake_required": retake_required,
            "correction_reason": (
                "IMPLAUSIBLE_MEASUREMENT"
                if retake_required and len(plausible_indices) < 2
                else "NO_CONSENSUS"
                if retake_required
                else "OUTLIER_REJECTED"
                if outlier_rejected
                else "NONE"
            ),
        }
