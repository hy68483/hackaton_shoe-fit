"""마커 기준 원근 보정과 OpenCV 기반 발 치수 계산을 제공한다."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


class ImageValidationError(RuntimeError):
    """원근 보정에 필요한 이미지 조건을 충족하지 못했을 때 발생한다."""


class MeasurementError(RuntimeError):
    """보정된 mask에서 발 치수를 계산하지 못했을 때 발생한다."""


@dataclass(frozen=True)
class MarkerLayout:
    """인쇄된 마커 중심의 실제 물리 배치(mm)다."""

    marker_size_mm: float = 40.0
    horizontal_center_distance_mm: float = 90.0
    vertical_center_distance_mm: float = 176.0

    def destination_centers(self, pixels_per_mm: float) -> np.ndarray:
        """좌상, 우상, 우하, 좌하 순서의 균일한 축척 좌표를 반환한다."""
        return np.array(
            [
                [0.0, 0.0],
                [self.horizontal_center_distance_mm * pixels_per_mm, 0.0],
                [
                    self.horizontal_center_distance_mm * pixels_per_mm,
                    self.vertical_center_distance_mm * pixels_per_mm,
                ],
                [0.0, self.vertical_center_distance_mm * pixels_per_mm],
            ],
            dtype=np.float32,
        )


class OpenCVService:
    """네 개의 40 mm 마커를 사용해 발 사진을 실측 좌표계로 변환한다."""

    # 실제 모바일 촬영본의 검증 결과(18.7~22.0)를 반영한 하한이다.
    # 이보다 낮으면 마커의 방향·외곽선도 안정적으로 식별하기 어렵다.
    MIN_BLUR_VARIANCE = 15.0
    MIN_BRIGHTNESS = 35.0
    MAX_BRIGHTNESS = 250.0
    PIXELS_PER_MM = 5.0

    def __init__(self, marker_layout: MarkerLayout | None = None) -> None:
        self.marker_layout = marker_layout or MarkerLayout()

    @staticmethod
    def _gray(image: np.ndarray) -> np.ndarray:
        return image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    @staticmethod
    def _order_points(points: np.ndarray) -> np.ndarray:
        """점 네 개를 좌상, 우상, 우하, 좌하 순서로 정렬한다."""
        ordered = np.zeros((4, 2), dtype=np.float32)
        sums = points.sum(axis=1)
        differences = np.diff(points, axis=1).reshape(-1)
        ordered[0] = points[np.argmin(sums)]
        ordered[2] = points[np.argmax(sums)]
        ordered[1] = points[np.argmin(differences)]
        ordered[3] = points[np.argmax(differences)]
        return ordered

    def _marker_quadrilaterals(self, image: np.ndarray) -> list[np.ndarray]:
        """가려지지 않은 네 개의 정사각형 마커 외곽을 반환한다."""
        if image is None or image.size == 0:
            return []

        gray = self._gray(image)
        # 조명에 따라 완전한 검정이 아니어도 검출할 수 있도록 어두운 영역을 이진화한다.
        _, binary = cv2.threshold(gray, 105, 255, cv2.THRESH_BINARY_INV)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        image_area = float(image.shape[0] * image.shape[1])
        candidates: list[tuple[float, np.ndarray]] = []

        for contour in contours:
            area = float(cv2.contourArea(contour))
            if area < image_area * 0.001 or area > image_area * 0.08:
                continue
            x, y, width, height = cv2.boundingRect(contour)
            aspect_ratio = width / max(height, 1)
            if not 0.72 <= aspect_ratio <= 1.28:
                continue
            rectangularity = area / max(float(width * height), 1.0)
            if rectangularity < 0.65:
                continue
            approx = cv2.approxPolyDP(contour, 0.04 * cv2.arcLength(contour, True), True)
            if len(approx) != 4 or not cv2.isContourConvex(approx):
                continue
            candidates.append((area, self._order_points(approx.reshape(4, 2).astype(np.float32))))

        if len(candidates) < 4:
            return []

        return [points for _, points in sorted(candidates, reverse=True, key=lambda item: item[0])[:4]]

    def detect_marker_centers(self, image: np.ndarray) -> np.ndarray | None:
        """사진 속 완전한 네 개의 40 mm 정사각형 마커 중심을 정렬한다.

        마커가 발이나 다리에 가려지면 중심의 실제 위치를 복원할 수 없으므로
        부분 사각형은 측정 보정에 사용하지 않는다.
        """
        quadrilaterals = self._marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return None

        centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
        return self._order_points(centers)

    def _marker_scale_is_consistent(self, image: np.ndarray) -> bool:
        """마커 한 변 40 mm와 중심거리 배치가 사진에서 함께 성립하는지 확인한다."""
        quadrilaterals = self._marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return False
        centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
        ordered_centers = self._order_points(centers)
        ordered_quadrilaterals = [
            min(quadrilaterals, key=lambda points: np.linalg.norm(points.mean(axis=0) - center))
            for center in ordered_centers
        ]
        destination_centers = self.marker_layout.destination_centers(self.PIXELS_PER_MM)
        matrix = cv2.getPerspectiveTransform(ordered_centers, destination_centers)
        side_lengths: list[float] = []
        for quadrilateral in ordered_quadrilaterals:
            corrected = cv2.perspectiveTransform(quadrilateral.reshape(-1, 1, 2), matrix).reshape(-1, 2)
            side_lengths.extend(
                float(np.linalg.norm(corrected[(index + 1) % 4] - corrected[index]))
                for index in range(4)
            )
        marker_side_mm = float(np.median(side_lengths) / self.PIXELS_PER_MM)
        return abs(marker_side_mm - self.marker_layout.marker_size_mm) <= self.marker_layout.marker_size_mm * 0.12

    def validate_image(self, image: np.ndarray) -> dict[str, Any]:
        if image is None or not isinstance(image, np.ndarray) or image.size == 0:
            return {"valid": False, "reason": "IMAGE_INVALID", "checks": {}}

        gray = self._gray(image)
        blur_ok = float(cv2.Laplacian(gray, cv2.CV_64F).var()) >= self.MIN_BLUR_VARIANCE
        brightness = float(gray.mean())
        brightness_ok = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS
        marker_ok = self.detect_marker_centers(image) is not None
        marker_scale_ok = marker_ok and self._marker_scale_is_consistent(image)
        checks = {
            "measurement_sheet": marker_ok,
            "foot_complete": True,
            "blur": blur_ok,
            "brightness": brightness_ok,
            "marker": marker_ok,
            "perspective": marker_scale_ok,
        }
        if not brightness_ok:
            return {"valid": False, "reason": "IMAGE_TOO_DARK", "checks": checks}
        if not blur_ok:
            return {"valid": False, "reason": "IMAGE_BLUR", "checks": checks}
        if not marker_ok:
            return {"valid": False, "reason": "MARKER_NOT_FOUND", "checks": checks}
        if not marker_scale_ok:
            return {"valid": False, "reason": "MARKER_SCALE_MISMATCH", "checks": checks}
        return {"valid": True, "checks": checks}

    def lower_leg_negative_point(self, image: np.ndarray) -> tuple[int, int] | None:
        """하단 마커 바깥의 하퇴 지점을 SAM 음성 프롬프트로 추정한다."""
        centers = self.detect_marker_centers(image)
        if centers is None:
            return None
        top_center = (centers[0] + centers[1]) / 2
        bottom_center = (centers[2] + centers[3]) / 2
        candidate = bottom_center + (bottom_center - top_center) * 0.20
        height, width = image.shape[:2]
        x, y = np.rint(candidate).astype(int)
        if not 0 <= x < width or not 0 <= y < height:
            return None
        return int(x), int(y)

    async def validate_image_quality(self, image_path: Path) -> dict[str, bool]:
        """업로드된 파일을 기존 이미지 검증 서비스가 요구하는 checks 형식으로 반환한다."""
        image = cv2.imread(str(image_path))
        result = self.validate_image(image)
        checks = result.get("checks", {})
        return {
            "measurement_sheet": bool(checks.get("measurement_sheet", False)),
            "foot_complete": bool(checks.get("foot_complete", False)),
            "blur": bool(checks.get("blur", False)),
            "brightness": bool(checks.get("brightness", False)),
            "marker": bool(checks.get("marker", False)),
            "perspective": bool(checks.get("perspective", False)),
        }

    def correct_perspective(self, image: np.ndarray, mask: np.ndarray | None = None) -> dict[str, Any]:
        """마커 중심 간 실제 거리(가로 90 mm, 세로 176 mm)로 원근을 보정한다."""
        source = self.detect_marker_centers(image)
        if source is None:
            raise ImageValidationError("PERSPECTIVE_FAILED")

        destination = self.marker_layout.destination_centers(self.PIXELS_PER_MM)
        base_matrix = cv2.getPerspectiveTransform(source, destination)

        # 발목처럼 마커 사각형 밖에 있는 영역도 잘리지 않도록 원본 전체의 변환 범위를 캔버스로 삼는다.
        height, width = image.shape[:2]
        image_corners = np.array([[[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]]], dtype=np.float32)
        transformed_corners = cv2.perspectiveTransform(image_corners, base_matrix)[0]
        min_x, min_y = np.floor(transformed_corners.min(axis=0)).astype(int)
        max_x, max_y = np.ceil(transformed_corners.max(axis=0)).astype(int)
        translation = np.array([[1.0, 0.0, -min_x], [0.0, 1.0, -min_y], [0.0, 0.0, 1.0]], dtype=np.float32)
        matrix = translation @ base_matrix
        output_size = (max(max_x - min_x + 1, 1), max(max_y - min_y + 1, 1))
        corrected = cv2.warpPerspective(image, matrix, output_size)
        corrected_mask = None
        if mask is not None:
            corrected_mask = cv2.warpPerspective(
                mask.astype(np.uint8), matrix, output_size, flags=cv2.INTER_NEAREST
            )
        return {
            "image": corrected,
            "mask": corrected_mask,
            "matrix": matrix,
            "scale_mm_per_px": 1.0 / self.PIXELS_PER_MM,
        }

    def measure_mask(self, mask: np.ndarray, scale_mm_per_px: float) -> dict[str, float]:
        if mask is None or mask.size == 0:
            raise MeasurementError("MEASUREMENT_FAILED")
        binary = (mask > 0).astype(np.uint8)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            raise MeasurementError("MEASUREMENT_FAILED")
        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < 100:
            raise MeasurementError("MEASUREMENT_FAILED")
        _, dimensions, _ = cv2.minAreaRect(contour)
        length_px, width_px = sorted(dimensions, reverse=True)
        if width_px <= 0 or length_px <= 0:
            raise MeasurementError("MEASUREMENT_FAILED")
        return {
            "foot_length_mm": round(float(length_px * scale_mm_per_px), 1),
            "foot_width_mm": round(float(width_px * scale_mm_per_px), 1),
        }
