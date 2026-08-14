"""마커 기준 원근 보정과 OpenCV 기반 발 치수 계산을 제공한다."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .camera_calibration import CameraCalibration


class ImageValidationError(RuntimeError):
    """원근 보정에 필요한 이미지 조건을 충족하지 못했을 때 발생한다."""


class MeasurementError(RuntimeError):
    """보정된 mask에서 발 치수를 계산하지 못했을 때 발생한다."""


@dataclass(frozen=True)
class MarkerLayout:
    """인쇄된 마커 중심의 실제 물리 배치(mm)다."""

    marker_size_mm: float = 25.0
    horizontal_center_distance_mm: float = 130.0
    vertical_center_distance_mm: float = 216.0

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


@dataclass(frozen=True)
class CheckerboardLayout:
    """체커보드의 내부 코너 개수와 한 칸의 실제 크기(mm)다."""

    inner_corner_columns: int = 5
    inner_corner_rows: int = 10
    square_size_mm: float = 30.0

    def destination_corners(
        self,
        pixels_per_mm: float,
        pattern_size: tuple[int, int] | None = None,
    ) -> np.ndarray:
        columns, rows = pattern_size or (self.inner_corner_columns, self.inner_corner_rows)
        coordinates = [
            [column * self.square_size_mm * pixels_per_mm, row * self.square_size_mm * pixels_per_mm]
            for row in range(rows)
            for column in range(columns)
        ]
        return np.asarray(coordinates, dtype=np.float32)


class OpenCVService:
    """네 개의 25 mm 마커를 사용해 발 사진을 실측 좌표계로 변환한다."""

    # 실제 모바일 촬영본의 검증 결과(18.7~22.0)를 반영한 하한이다.
    # 이보다 낮으면 마커의 방향·외곽선도 안정적으로 식별하기 어렵다.
    MIN_BLUR_VARIANCE = 15.0
    MIN_BRIGHTNESS = 35.0
    MAX_BRIGHTNESS = 250.0
    PIXELS_PER_MM = 5.0
    ANKLE_CUTOFF_INSET_MM = 25.0
    MAX_POSE_REPROJECTION_ERROR_PX = 3.0
    MIN_CHECKERBOARD_SQUARE_PX = 12.0

    def __init__(
        self,
        marker_layout: MarkerLayout | None = None,
        checkerboard_layout: CheckerboardLayout | None = None,
        camera_calibration: CameraCalibration | None = None,
    ) -> None:
        self.marker_layout = marker_layout or MarkerLayout()
        self.checkerboard_layout = checkerboard_layout or CheckerboardLayout()
        self.camera_calibration = camera_calibration

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
        # 낮은 임계값으로 피부·그림자와 검은 마커를 분리한다.
        _, binary = cv2.threshold(gray, 85, 255, cv2.THRESH_BINARY_INV)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        image_area = float(image.shape[0] * image.shape[1])
        candidates: list[tuple[float, np.ndarray]] = []

        for contour in contours:
            area = float(cv2.contourArea(contour))
            if area < image_area * 0.00015 or area > image_area * 0.08:
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

    @staticmethod
    def _detect_apriltag_markers(image: np.ndarray) -> list[tuple[int, np.ndarray]]:
        """AprilTag-36h11 ID와 네 모서리를 검출한다."""
        aruco = getattr(cv2, "aruco", None)
        if aruco is None:
            return []
        dictionary = aruco.getPredefinedDictionary(aruco.DICT_APRILTAG_36h11)
        detector = getattr(aruco, "ArucoDetector", None)
        gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        if detector is not None:
            corners, ids, _ = detector(dictionary).detectMarkers(gray)
        else:
            corners, ids, _ = aruco.detectMarkers(gray, dictionary)
        if ids is None:
            return []
        return [
            (int(marker_id), corners[index].reshape(4, 2).astype(np.float32))
            for index, marker_id in enumerate(ids.flatten())
        ]

    def _ordered_marker_quadrilaterals(self, image: np.ndarray) -> list[np.ndarray]:
        tag_markers = self._detect_apriltag_markers(image)
        quadrilaterals = [points for _, points in tag_markers] if len(tag_markers) == 4 else self._marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return []
        centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
        ordered_centers = self._order_points(centers)
        return [
            min(quadrilaterals, key=lambda points: np.linalg.norm(points.mean(axis=0) - center))
            for center in ordered_centers
        ]

    def detect_marker_centers(self, image: np.ndarray) -> np.ndarray | None:
        """사진 속 완전한 네 개의 25 mm 정사각형 마커 중심을 정렬한다.

        마커가 발이나 다리에 가려지면 중심의 실제 위치를 복원할 수 없으므로
        부분 사각형은 측정 보정에 사용하지 않는다.
        """
        quadrilaterals = self._ordered_marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return None

        centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
        return self._order_points(centers)

    def _detect_checkerboard_corners(self, image: np.ndarray) -> tuple[np.ndarray, tuple[int, int]] | None:
        """완전히 보이는 3 cm 체커보드의 내부 코너를 검출한다.

        기본 측정지는 5x10 내부 코너이며, 세로/가로로 돌려 촬영한 경우도 허용한다.
        발이 체커보드 중심을 가리면 표준 OpenCV 검출이 실패할 수 있으므로, 실제
        측정지에서는 체커보드 코너 영역을 발 바깥 테두리에 배치해야 한다.
        """
        if image is None or image.size == 0:
            return None
        gray = self._gray(image)
        configured = (
            self.checkerboard_layout.inner_corner_columns,
            self.checkerboard_layout.inner_corner_rows,
        )
        pattern_sizes = (configured, configured[::-1])
        for pattern_size in pattern_sizes:
            if pattern_size[0] < 2 or pattern_size[1] < 2:
                continue
            found, corners = cv2.findChessboardCornersSB(
                gray,
                pattern_size,
                flags=cv2.CALIB_CB_NORMALIZE_IMAGE | cv2.CALIB_CB_EXHAUSTIVE,
            )
            if not found or corners is None:
                found, corners = cv2.findChessboardCorners(
                    gray,
                    pattern_size,
                    flags=cv2.CALIB_CB_ADAPTIVE_THRESH | cv2.CALIB_CB_NORMALIZE_IMAGE,
                )
                if found and corners is not None:
                    corners = cv2.cornerSubPix(
                        gray,
                        corners,
                        (11, 11),
                        (-1, -1),
                        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.1),
                    )
            if found and corners is not None:
                return corners.reshape(-1, 2).astype(np.float32), pattern_size
        return None

    def _reference_plane(self, image: np.ndarray) -> dict[str, Any] | None:
        """AprilTag 또는 체커보드에서 원근 보정에 필요한 대응점을 만든다."""
        marker_centers = self.detect_marker_centers(image)
        if marker_centers is not None:
            return {
                "kind": "APRILTAG",
                "source": marker_centers,
                "destination": self.marker_layout.destination_centers(self.PIXELS_PER_MM),
                "marker_centers": marker_centers,
            }

        checkerboard = self._detect_checkerboard_corners(image)
        if checkerboard is None:
            return None
        source, pattern_size = checkerboard
        return {
            "kind": "CHECKERBOARD",
            "source": source,
            "destination": self.checkerboard_layout.destination_corners(self.PIXELS_PER_MM, pattern_size),
            "marker_centers": None,
            "pattern_size": pattern_size,
        }

    def _marker_scale_is_consistent(self, image: np.ndarray) -> bool:
        """마커 한 변 25 mm와 중심거리 배치가 사진에서 함께 성립하는지 확인한다."""
        quadrilaterals = self._ordered_marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return False
        centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
        ordered_centers = self._order_points(centers)
        destination_centers = self.marker_layout.destination_centers(self.PIXELS_PER_MM)
        matrix = cv2.getPerspectiveTransform(ordered_centers, destination_centers)
        side_lengths: list[float] = []
        for quadrilateral in quadrilaterals:
            corrected = cv2.perspectiveTransform(quadrilateral.reshape(-1, 1, 2), matrix).reshape(-1, 2)
            side_lengths.extend(
                float(np.linalg.norm(corrected[(index + 1) % 4] - corrected[index]))
                for index in range(4)
            )
        marker_side_mm = float(np.median(side_lengths) / self.PIXELS_PER_MM)
        return abs(marker_side_mm - self.marker_layout.marker_size_mm) <= self.marker_layout.marker_size_mm * 0.12

    def _checkerboard_scale_is_consistent(self, image: np.ndarray) -> bool:
        detected = self._detect_checkerboard_corners(image)
        if detected is None:
            return False
        corners, pattern_size = detected
        columns, rows = pattern_size
        grid = corners.reshape(rows, columns, 2)
        horizontal = np.linalg.norm(grid[:, 1:, :] - grid[:, :-1, :], axis=2).reshape(-1)
        vertical = np.linalg.norm(grid[1:, :, :] - grid[:-1, :, :], axis=2).reshape(-1)
        spacings = np.concatenate((horizontal, vertical))
        return bool(len(spacings) and np.percentile(spacings, 10) >= self.MIN_CHECKERBOARD_SQUARE_PX)

    def _reference_scale_is_consistent(self, image: np.ndarray, reference: dict[str, Any] | None) -> bool:
        if reference is None:
            return False
        if reference["kind"] == "APRILTAG":
            return self._marker_scale_is_consistent(image)
        return self._checkerboard_scale_is_consistent(image)

    def validate_image(self, image: np.ndarray) -> dict[str, Any]:
        if image is None or not isinstance(image, np.ndarray) or image.size == 0:
            return {"valid": False, "reason": "IMAGE_INVALID", "checks": {}}

        gray = self._gray(image)
        blur_ok = float(cv2.Laplacian(gray, cv2.CV_64F).var()) >= self.MIN_BLUR_VARIANCE
        brightness = float(gray.mean())
        brightness_ok = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS
        reference = self._reference_plane(image)
        marker_ok = reference is not None
        marker_scale_ok = self._reference_scale_is_consistent(image, reference)
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
        height, width = image.shape[:2]
        raw_candidates = (
            top_center + (top_center - bottom_center) * 0.20,
            bottom_center + (bottom_center - top_center) * 0.20,
        )
        candidates = []
        for candidate in raw_candidates:
            x, y = np.rint(candidate).astype(int)
            if 0 <= x < width and 0 <= y < height:
                candidates.append((int(x), int(y)))
        if not candidates:
            return None

        def skin_score(point: tuple[int, int]) -> float:
            x, y = point
            radius = 25
            patch = image[max(0, y - radius) : min(height, y + radius + 1), max(0, x - radius) : min(width, x + radius + 1)]
            if patch.size == 0:
                return float("-inf")
            hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
            blue, _, red = patch.reshape(-1, 3).mean(axis=0)
            return float(red - blue + hsv[:, :, 1].mean())

        scores = [skin_score(candidate) for candidate in candidates]
        best_index = int(np.argmax(scores))
        if scores[best_index] < 15.0:
            return candidates[-1]
        return candidates[best_index]

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

    def _trim_lower_leg_from_mask(
        self,
        mask: np.ndarray,
        transformed_marker_centers: np.ndarray,
        transformed_negative_point: np.ndarray,
    ) -> np.ndarray:
        """마커 행 바깥의 하퇴를 제외하고 발 마스크만 남긴다."""
        if mask is None or mask.size == 0:
            return mask

        top_row = (transformed_marker_centers[0] + transformed_marker_centers[1]) / 2
        bottom_row = (transformed_marker_centers[2] + transformed_marker_centers[3]) / 2
        leg_row = min((top_row, bottom_row), key=lambda row: np.linalg.norm(row - transformed_negative_point))
        inset_px = int(round(self.ANKLE_CUTOFF_INSET_MM * self.PIXELS_PER_MM))
        trimmed = mask.copy()
        height = trimmed.shape[0]
        if leg_row[1] < height / 2:
            cutoff = max(int(round(leg_row[1])) - inset_px, 0)
            trimmed[:cutoff, :] = 0
        else:
            cutoff = min(int(round(leg_row[1])) + inset_px, height)
            trimmed[cutoff:, :] = 0
        return trimmed

    def estimate_camera_pose(self, image: np.ndarray) -> dict[str, Any] | None:
        """보정된 카메라와 평면 마커로부터 카메라 자세를 추정한다."""
        if self.camera_calibration is None:
            return None
        image_size = (image.shape[1], image.shape[0])
        if (
            self.camera_calibration.image_size_px is not None
            and self.camera_calibration.image_size_px != image_size
        ):
            return None
        quadrilaterals = self._ordered_marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return None

        marker_size = self.marker_layout.marker_size_mm
        half_size = marker_size / 2.0
        centers = self.marker_layout.destination_centers(pixels_per_mm=1.0)
        local_corners = np.array(
            [
                [-half_size, -half_size, 0.0],
                [half_size, -half_size, 0.0],
                [half_size, half_size, 0.0],
                [-half_size, half_size, 0.0],
            ],
            dtype=np.float64,
        )
        object_points = np.concatenate(
            [local_corners + np.array([center[0], center[1], 0.0]) for center in centers]
        )
        image_points = np.concatenate(
            [self._order_points(quadrilateral).astype(np.float64) for quadrilateral in quadrilaterals]
        )
        success, rotation_vector, translation_vector = cv2.solvePnP(
            object_points,
            image_points,
            self.camera_calibration.camera_matrix,
            self.camera_calibration.distortion_coefficients,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            return None
        projected, _ = cv2.projectPoints(
            object_points,
            rotation_vector,
            translation_vector,
            self.camera_calibration.camera_matrix,
            self.camera_calibration.distortion_coefficients,
        )
        reprojection_error_px = float(
            np.sqrt(np.mean(np.sum((projected.reshape(-1, 2) - image_points) ** 2, axis=1)))
        )
        if reprojection_error_px > self.MAX_POSE_REPROJECTION_ERROR_PX:
            return None
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        camera_center = -rotation_matrix.T @ translation_vector
        # The board coordinate system follows OpenCV image axes (x right, y down).
        # Consequently a camera looking at z=0 is located at negative z, while a
        # physical point elevated above the board has a negative board z value.
        camera_height_mm = float(abs(camera_center[2, 0]))
        if not np.isfinite(camera_height_mm) or camera_height_mm <= 0:
            return None
        return {
            "rotation_vector": rotation_vector,
            "translation_vector": translation_vector,
            "camera_height_mm": camera_height_mm,
            "reprojection_error_px": reprojection_error_px,
        }

    def _backproject_points_to_height(
        self,
        image_points: np.ndarray,
        pose: dict[str, Any],
        height_mm: float,
    ) -> np.ndarray:
        if self.camera_calibration is None:
            raise MeasurementError("CAMERA_CALIBRATION_REQUIRED")
        normalized = cv2.undistortPoints(
            image_points.reshape(-1, 1, 2).astype(np.float64),
            self.camera_calibration.camera_matrix,
            self.camera_calibration.distortion_coefficients,
        ).reshape(-1, 2)
        camera_rays = np.column_stack((normalized, np.ones(len(normalized))))
        rotation_matrix, _ = cv2.Rodrigues(pose["rotation_vector"])
        translation_vector = pose["translation_vector"].reshape(3, 1)
        camera_center = (-rotation_matrix.T @ translation_vector).reshape(3)
        world_rays = camera_rays @ rotation_matrix
        denominators = world_rays[:, 2]
        # ``height_mm`` is a physical height above the marker plane. In this board
        # coordinate convention that plane is z=-height_mm (towards the camera).
        distances = (-height_mm - camera_center[2]) / denominators
        valid = np.isfinite(distances) & (distances > 0)
        if not np.all(valid):
            raise MeasurementError("PARALLAX_BACKPROJECTION_FAILED")
        world_points = camera_center + world_rays * distances[:, np.newaxis]
        return world_points[:, :2].astype(np.float32)

    def measure_mask_with_parallax(
        self,
        corrected_mask: np.ndarray,
        perspective_matrix: np.ndarray,
        pose: dict[str, Any],
    ) -> dict[str, float | str | bool]:
        """평면 보정 마스크를 유효 높이 평면으로 역투영해 길이와 폭을 계산한다."""
        if self.camera_calibration is None:
            raise MeasurementError("CAMERA_CALIBRATION_REQUIRED")
        binary = (corrected_mask > 0).astype(np.uint8)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            raise MeasurementError("MEASUREMENT_FAILED")
        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < 100:
            raise MeasurementError("MEASUREMENT_FAILED")
        inverse_matrix = np.linalg.inv(perspective_matrix)
        source_points = cv2.perspectiveTransform(contour.astype(np.float32), inverse_matrix).reshape(-1, 2)

        length_points = self._backproject_points_to_height(
            source_points,
            pose,
            self.camera_calibration.length_effective_height_mm,
        )
        width_points = self._backproject_points_to_height(
            source_points,
            pose,
            self.camera_calibration.width_effective_height_mm,
        )
        _, length_dimensions, _ = cv2.minAreaRect(length_points.reshape(-1, 1, 2))
        _, width_dimensions, _ = cv2.minAreaRect(width_points.reshape(-1, 1, 2))
        length_mm = max(length_dimensions)
        width_mm = min(width_dimensions)
        if length_mm <= 0 or width_mm <= 0:
            raise MeasurementError("MEASUREMENT_FAILED")
        return {
            "foot_length_mm": round(float(length_mm), 1),
            "foot_width_mm": round(float(width_mm), 1),
            "parallax_correction_applied": True,
            "camera_height_mm": round(float(pose["camera_height_mm"]), 1),
            "camera_reprojection_error_px": round(float(pose["reprojection_error_px"]), 2),
            "camera_calibration_version": self.camera_calibration.version,
        }

    def correct_perspective(self, image: np.ndarray, mask: np.ndarray | None = None) -> dict[str, Any]:
        """마커 중심 간 실제 거리(가로 130 mm, 세로 216 mm)로 원근을 보정한다."""
        reference = self._reference_plane(image)
        if reference is None:
            raise ImageValidationError("PERSPECTIVE_FAILED")
        source = reference["source"]
        destination = reference["destination"]
        if len(source) == 4:
            base_matrix = cv2.getPerspectiveTransform(source, destination)
        else:
            base_matrix, _ = cv2.findHomography(source, destination, method=0)
            if base_matrix is None:
                raise ImageValidationError("PERSPECTIVE_FAILED")

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
            leg_negative_point = self.lower_leg_negative_point(image)
            if leg_negative_point is not None and reference["marker_centers"] is not None:
                marker_centers = reference["marker_centers"]
                transformed_markers = cv2.perspectiveTransform(marker_centers.reshape(-1, 1, 2), matrix).reshape(-1, 2)
                transformed_negative_point = cv2.perspectiveTransform(
                    np.array([[leg_negative_point]], dtype=np.float32), matrix
                ).reshape(2)
                corrected_mask = self._trim_lower_leg_from_mask(
                    corrected_mask,
                    transformed_markers,
                    transformed_negative_point,
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
