"""OpenCV로 이미지 품질을 검사하고 발 치수를 mm 단위로 계산한다."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np


class ImageValidationError(RuntimeError):
    """원근 보정에 필요한 이미지 조건을 충족하지 못했을 때 발생한다."""


class MeasurementError(RuntimeError):
    """보정된 mask에서 발 치수를 계산하지 못했을 때 발생한다."""


class OpenCVService:
    A4_WIDTH_MM = 210.0
    A4_HEIGHT_MM = 297.0
    MIN_BLUR_VARIANCE = 80.0
    MIN_BRIGHTNESS = 35.0
    MAX_BRIGHTNESS = 250.0

    @staticmethod
    def _gray(image: np.ndarray) -> np.ndarray:
        # OpenCV 품질 검사와 marker 검출은 단일 채널 밝기 이미지로 수행한다.
        return image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    def _sheet_corners(self, image: np.ndarray) -> np.ndarray | None:
        # A4 측정지의 외곽선을 찾기 위해 노이즈를 줄이고 edge를 추출한다.
        gray = self._gray(image)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 60, 180)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        image_area = image.shape[0] * image.shape[1]
        # 이미지의 15% 이상을 차지하는 큰 사각형만 측정지 후보로 사용한다.
        for contour in sorted(contours, key=cv2.contourArea, reverse=True):
            if cv2.contourArea(contour) < image_area * 0.15:
                break
            approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                return approx.reshape(4, 2).astype(np.float32)
        return None

    def _marker_found(self, image: np.ndarray) -> bool:
        """OpenCV 4·5 환경에서 ArUco marker 존재 여부를 확인한다."""
        aruco = getattr(cv2, "aruco", None)
        if aruco is None:
            return False
        dictionary = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
        detector = getattr(aruco, "ArucoDetector", None)
        # OpenCV 5는 ArucoDetector 객체를, 이전 버전은 함수 기반 API를 사용한다.
        if detector is not None:
            corners, ids, _ = detector(dictionary).detectMarkers(self._gray(image))
        else:
            corners, ids, _ = aruco.detectMarkers(self._gray(image), dictionary)
        return ids is not None and len(corners) > 0

    def validate_image(self, image: np.ndarray) -> dict[str, Any]:
        # 이미지가 없으면 이후 모든 분석을 수행하지 않는다.
        if image is None or not isinstance(image, np.ndarray) or image.size == 0:
            return {"valid": False, "reason": "IMAGE_INVALID", "checks": {}}
        gray = self._gray(image)
        # Laplacian 분산은 작을수록 흐린 이미지이므로 최소 임계값과 비교한다.
        blur_ok = float(cv2.Laplacian(gray, cv2.CV_64F).var()) >= self.MIN_BLUR_VARIANCE
        brightness = float(gray.mean())
        brightness_ok = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS
        corners = self._sheet_corners(image)
        sheet_ok = corners is not None
        marker_ok = self._marker_found(image)
        # 원근 보정은 측정지의 네 모서리를 찾을 수 있을 때만 가능하다.
        checks = {"measurement_sheet": sheet_ok, "blur": blur_ok, "brightness": brightness_ok, "marker": marker_ok, "perspective": sheet_ok}
        # 조명 문제를 먼저 반환해 사용자가 재촬영 방법을 바로 알 수 있게 한다.
        if not brightness_ok:
            return {"valid": False, "reason": "IMAGE_TOO_DARK", "checks": checks}
        if not blur_ok:
            return {"valid": False, "reason": "IMAGE_BLUR", "checks": checks}
        if not sheet_ok:
            return {"valid": False, "reason": "MEASUREMENT_SHEET_NOT_FOUND", "checks": checks}
        if not marker_ok:
            return {"valid": False, "reason": "MARKER_NOT_FOUND", "checks": checks}
        return {"valid": True, "checks": checks}

    @staticmethod
    def _ordered_corners(corners: np.ndarray) -> np.ndarray:
        # 합과 차이를 이용해 좌상·우상·우하·좌하 순서로 모서리를 정렬한다.
        ordered = np.zeros((4, 2), dtype=np.float32)
        sums = corners.sum(axis=1)
        differences = np.diff(corners, axis=1).reshape(-1)
        ordered[0] = corners[np.argmin(sums)]
        ordered[2] = corners[np.argmax(sums)]
        ordered[1] = corners[np.argmin(differences)]
        ordered[3] = corners[np.argmax(differences)]
        return ordered

    def correct_perspective(self, image: np.ndarray, mask: np.ndarray | None = None) -> dict[str, Any]:
        # 원본 이미지와 SAM mask에 동일한 homography를 적용해야 치수가 일치한다.
        corners = self._sheet_corners(image)
        if corners is None:
            raise ImageValidationError("PERSPECTIVE_FAILED")
        source = self._ordered_corners(corners)
        # A4 실물 크기를 10 px/mm 해상도의 정면 좌표계로 변환한다.
        width_px, height_px = 2100, 2970
        destination = np.array([[0, 0], [width_px - 1, 0], [width_px - 1, height_px - 1], [0, height_px - 1]], dtype=np.float32)
        matrix = cv2.getPerspectiveTransform(source, destination)
        corrected = cv2.warpPerspective(image, matrix, (width_px, height_px))
        # mask는 값이 번지지 않도록 최근접 보간법으로 보정한다.
        corrected_mask = None if mask is None else cv2.warpPerspective(mask.astype(np.uint8), matrix, (width_px, height_px), flags=cv2.INTER_NEAREST)
        return {"image": corrected, "mask": corrected_mask, "matrix": matrix, "scale_mm_per_px": self.A4_WIDTH_MM / width_px}

    def measure_mask(self, mask: np.ndarray, scale_mm_per_px: float) -> dict[str, float]:
        # 빈 mask는 발 contour를 만들 수 없으므로 측정 실패로 처리한다.
        if mask is None or mask.size == 0:
            raise MeasurementError("MEASUREMENT_FAILED")
        binary = (mask > 0).astype(np.uint8)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            raise MeasurementError("MEASUREMENT_FAILED")
        # 작은 노이즈 대신 가장 큰 연결 영역을 발 contour로 선택한다.
        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < 100:
            raise MeasurementError("MEASUREMENT_FAILED")
        # MVP에서는 회전 사각형의 긴 변을 발 길이, 짧은 변을 발볼로 사용한다.
        _, dimensions, _ = cv2.minAreaRect(contour)
        length_px, width_px = sorted(dimensions, reverse=True)
        if width_px <= 0 or length_px <= 0:
            raise MeasurementError("MEASUREMENT_FAILED")
        # 보정된 픽셀 크기를 공통 scale로 변환해 mm 단위로 반환한다.
        return {"foot_length_mm": round(float(length_px * scale_mm_per_px), 1), "foot_width_mm": round(float(width_px * scale_mm_per_px), 1)}
