"""한쪽 발의 SAM 분할과 OpenCV 측정을 연결하는 파이프라인이다."""

from __future__ import annotations

import numpy as np

from .opencv_service import ImageValidationError, MeasurementError, OpenCVService
from .sam_service import SAMService, SegmentationError


class MeasurementService:
    def __init__(self, sam_service: SAMService | None = None, opencv_service: OpenCVService | None = None) -> None:
        # 테스트에서는 가짜 서비스 주입이 가능하고, 기본 실행은 실제 서비스로 구성한다.
        self.sam_service = sam_service or SAMService()
        self.opencv_service = opencv_service or OpenCVService()

    def analyze_foot(self, image: np.ndarray, point_x: int, point_y: int) -> dict[str, float | bool | str]:
        """한쪽 발의 mm 치수 또는 문서화된 실패 코드를 반환한다."""
        # 유효하지 않은 사진은 SAM 추론과 치수 계산을 수행하지 않는다.
        validation = self.opencv_service.validate_image(image)
        if not validation["valid"]:
            return {"success": False, "reason": validation["reason"]}
        try:
            # 사용자 선택 좌표로 발 mask를 만들고, 원근 보정 후 치수를 계산한다.
            segmentation = self.sam_service.segment(image, point_x, point_y)
            corrected = self.opencv_service.correct_perspective(image, segmentation["mask"])
            dimensions = self.opencv_service.measure_mask(corrected["mask"], corrected["scale_mm_per_px"])
        except SegmentationError:
            # checkpoint·추론·mask 오류를 하나의 공개 실패 코드로 정규화한다.
            return {"success": False, "reason": "SEGMENTATION_FAILED"}
        except ImageValidationError:
            # 검증을 통과했더라도 보정 단계에서 실패할 가능성을 별도 처리한다.
            return {"success": False, "reason": "PERSPECTIVE_FAILED"}
        except MeasurementError:
            # contour가 없거나 길이·발볼을 계산할 수 없으면 측정 실패를 반환한다.
            return {"success": False, "reason": "MEASUREMENT_FAILED"}
        # 성공 응답에는 문서에서 요구한 세 개의 측정값만 포함한다.
        return {**dimensions, "segmentation_confidence": float(segmentation["segmentation_confidence"])}
