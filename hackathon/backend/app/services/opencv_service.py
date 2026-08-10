"""OpenCV validation, calibration and measurement helpers."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np


class ImageValidationError(RuntimeError):
    """Input image failed a required measurement precondition."""


class MeasurementError(RuntimeError):
    """A calibrated foot measurement could not be calculated."""


class OpenCVService:
    A4_WIDTH_MM = 210.0
    A4_HEIGHT_MM = 297.0
    MIN_BLUR_VARIANCE = 80.0
    MIN_BRIGHTNESS = 35.0
    MAX_BRIGHTNESS = 250.0

    @staticmethod
    def _gray(image: np.ndarray) -> np.ndarray:
        return image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    def _sheet_corners(self, image: np.ndarray) -> np.ndarray | None:
        gray = self._gray(image)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 60, 180)
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        image_area = image.shape[0] * image.shape[1]
        for contour in sorted(contours, key=cv2.contourArea, reverse=True):
            if cv2.contourArea(contour) < image_area * 0.15:
                break
            approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                return approx.reshape(4, 2).astype(np.float32)
        return None

    def _marker_found(self, image: np.ndarray) -> bool:
        """Detect an ArUco marker when OpenCV-contrib is available."""
        aruco = getattr(cv2, "aruco", None)
        if aruco is None:
            return False
        dictionary = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
        detector = getattr(aruco, "ArucoDetector", None)
        if detector is not None:
            corners, ids, _ = detector(dictionary).detectMarkers(self._gray(image))
        else:
            corners, ids, _ = aruco.detectMarkers(self._gray(image), dictionary)
        return ids is not None and len(corners) > 0

    def validate_image(self, image: np.ndarray) -> dict[str, Any]:
        if image is None or not isinstance(image, np.ndarray) or image.size == 0:
            return {"valid": False, "reason": "IMAGE_INVALID", "checks": {}}
        gray = self._gray(image)
        blur_ok = float(cv2.Laplacian(gray, cv2.CV_64F).var()) >= self.MIN_BLUR_VARIANCE
        brightness = float(gray.mean())
        brightness_ok = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS
        corners = self._sheet_corners(image)
        sheet_ok = corners is not None
        marker_ok = self._marker_found(image)
        checks = {"measurement_sheet": sheet_ok, "blur": blur_ok, "brightness": brightness_ok, "marker": marker_ok, "perspective": sheet_ok}
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
        ordered = np.zeros((4, 2), dtype=np.float32)
        sums = corners.sum(axis=1)
        differences = np.diff(corners, axis=1).reshape(-1)
        ordered[0] = corners[np.argmin(sums)]
        ordered[2] = corners[np.argmax(sums)]
        ordered[1] = corners[np.argmin(differences)]
        ordered[3] = corners[np.argmax(differences)]
        return ordered

    def correct_perspective(self, image: np.ndarray, mask: np.ndarray | None = None) -> dict[str, Any]:
        corners = self._sheet_corners(image)
        if corners is None:
            raise ImageValidationError("PERSPECTIVE_FAILED")
        source = self._ordered_corners(corners)
        width_px, height_px = 2100, 2970  # calibrated output: 10 pixels per millimetre
        destination = np.array([[0, 0], [width_px - 1, 0], [width_px - 1, height_px - 1], [0, height_px - 1]], dtype=np.float32)
        matrix = cv2.getPerspectiveTransform(source, destination)
        corrected = cv2.warpPerspective(image, matrix, (width_px, height_px))
        corrected_mask = None if mask is None else cv2.warpPerspective(mask.astype(np.uint8), matrix, (width_px, height_px), flags=cv2.INTER_NEAREST)
        return {"image": corrected, "mask": corrected_mask, "matrix": matrix, "scale_mm_per_px": self.A4_WIDTH_MM / width_px}

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
        return {"foot_length_mm": round(float(length_px * scale_mm_per_px), 1), "foot_width_mm": round(float(width_px * scale_mm_per_px), 1)}
