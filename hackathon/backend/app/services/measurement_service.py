"""Single-foot SAM and OpenCV measurement pipeline."""

from __future__ import annotations

import numpy as np

from .opencv_service import ImageValidationError, MeasurementError, OpenCVService
from .sam_service import SAMService, SegmentationError


class MeasurementService:
    def __init__(self, sam_service: SAMService | None = None, opencv_service: OpenCVService | None = None) -> None:
        self.sam_service = sam_service or SAMService()
        self.opencv_service = opencv_service or OpenCVService()

    def analyze_foot(self, image: np.ndarray, point_x: int, point_y: int) -> dict[str, float | bool | str]:
        """Return calibrated dimensions for one foot, or a documented failure code."""
        validation = self.opencv_service.validate_image(image)
        if not validation["valid"]:
            return {"success": False, "reason": validation["reason"]}
        try:
            segmentation = self.sam_service.segment(image, point_x, point_y)
            corrected = self.opencv_service.correct_perspective(image, segmentation["mask"])
            dimensions = self.opencv_service.measure_mask(corrected["mask"], corrected["scale_mm_per_px"])
        except SegmentationError:
            return {"success": False, "reason": "SEGMENTATION_FAILED"}
        except ImageValidationError:
            return {"success": False, "reason": "PERSPECTIVE_FAILED"}
        except MeasurementError:
            return {"success": False, "reason": "MEASUREMENT_FAILED"}
        return {**dimensions, "segmentation_confidence": float(segmentation["segmentation_confidence"])}
