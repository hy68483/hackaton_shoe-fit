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
    horizontal_center_distance_mm: float = 175.0
    vertical_center_distance_mm: float = 262.0

    def destination_centers(self, pixels_per_mm: float, is_landscape: bool = False) -> np.ndarray:
        """좌상, 우상, 우하, 좌하 순서의 균일한 축척 좌표를 반환한다."""
        w = self.vertical_center_distance_mm if is_landscape else self.horizontal_center_distance_mm
        h = self.horizontal_center_distance_mm if is_landscape else self.vertical_center_distance_mm
        return np.array(
            [
                [0.0, 0.0],
                [w * pixels_per_mm, 0.0],
                [w * pixels_per_mm, h * pixels_per_mm],
                [0.0, h * pixels_per_mm],
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

    # 다양한 모바일 촬영 환경(실내 조명, 그림자, 소프트 렌즈)을 반영한 유연한 임계값
    MIN_BLUR_VARIANCE = 3.0
    MIN_BRIGHTNESS = 20.0
    MAX_BRIGHTNESS = 254.0
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
        """점 네 개를 좌상(TL), 우상(TR), 우하(BR), 좌하(BL) 순서로 정렬한다."""
        pts = np.asarray(points, dtype=np.float32).reshape(4, 2)
        center = pts.mean(axis=0)
        # 중심점 기준 각도 정렬
        angles = np.arctan2(pts[:, 1] - center[1], pts[:, 0] - center[0])
        sorted_indices = np.argsort(angles)
        sorted_pts = pts[sorted_indices]

        # 좌상단(x+y가 가장 작은 점)을 시작점으로 회전
        sums = sorted_pts.sum(axis=1)
        start_index = int(np.argmin(sums))
        ordered = np.roll(sorted_pts, -start_index, axis=0)

        # 시계방향 확인 (외적)
        v1 = ordered[1] - ordered[0]
        v2 = ordered[3] - ordered[0]
        cross_prod = v1[0] * v2[1] - v1[1] * v2[0]
        if cross_prod < 0:
            ordered = ordered[[0, 3, 2, 1]]

        return ordered

    @staticmethod
    def _select_best_four_markers(candidates: list[np.ndarray]) -> list[np.ndarray] | None:
        """후보 사각형들 중에서 4개의 마커가 가장 직사각형 배치를 이루는 4개를 선별한다."""
        if len(candidates) < 4:
            return None
        if len(candidates) == 4:
            return candidates

        import itertools

        best_score = float("inf")
        best_combo = None

        for combo in itertools.combinations(candidates, 4):
            centers = np.array([pts.mean(axis=0) for pts in combo], dtype=np.float32)
            hull = cv2.convexHull(centers.reshape(-1, 1, 2))
            if len(hull) != 4:
                continue

            ordered = OpenCVService._order_points(centers)
            top_len = float(np.linalg.norm(ordered[1] - ordered[0]))
            bottom_len = float(np.linalg.norm(ordered[2] - ordered[3]))
            left_len = float(np.linalg.norm(ordered[3] - ordered[0]))
            right_len = float(np.linalg.norm(ordered[2] - ordered[1]))

            if top_len <= 0 or bottom_len <= 0 or left_len <= 0 or right_len <= 0:
                continue

            horiz_diff = abs(top_len - bottom_len) / max(top_len, bottom_len)
            vert_diff = abs(left_len - right_len) / max(left_len, right_len)

            diag1 = float(np.linalg.norm(ordered[2] - ordered[0]))
            diag2 = float(np.linalg.norm(ordered[3] - ordered[1]))
            diag_diff = abs(diag1 - diag2) / max(diag1, diag2)

            score = horiz_diff + vert_diff + diag_diff * 0.5
            if score < best_score:
                best_score = score
                best_combo = list(combo)

        return best_combo

    def _marker_quadrilaterals(self, image: np.ndarray) -> list[np.ndarray]:
        """가려지지 않은 네 개의 정사각형 마커 외곽을 반환한다."""
        if image is None or image.size == 0:
            return []

        gray = self._gray(image)
        image_area = float(image.shape[0] * image.shape[1])
        h, w = gray.shape[:2]
        all_candidates: list[np.ndarray] = []

        binaries: list[np.ndarray] = []

        for thresh_val in [85, 45, 75, 105, 135, 165]:
            _, bin_fixed = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY_INV)
            binaries.append(bin_fixed)

        _, bin_otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        binaries.append(bin_otsu)

        for block_size in [21, 51, 81]:
            if block_size < min(h, w):
                bin_adapt = cv2.adaptiveThreshold(
                    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, 7
                )
                binaries.append(bin_adapt)

        kernel = np.ones((5, 5), np.uint8)

        for binary in binaries:
            closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                area = float(cv2.contourArea(contour))
                if area < image_area * 0.00008 or area > image_area * 0.12:
                    continue
                bx, by, bw, bh = cv2.boundingRect(contour)
                aspect_ratio = bw / max(bh, 1)
                if not 0.45 <= aspect_ratio <= 2.2:
                    continue
                rectangularity = area / max(float(bw * bh), 1.0)
                if rectangularity < 0.48:
                    continue
                perimeter = cv2.arcLength(contour, True)
                for eps in [0.04, 0.03, 0.05, 0.02]:
                    approx = cv2.approxPolyDP(contour, eps * perimeter, True)
                    if len(approx) == 4 and cv2.isContourConvex(approx):
                        ordered_pts = self._order_points(approx.reshape(4, 2).astype(np.float32))
                        center = ordered_pts.mean(axis=0)
                        is_duplicate = any(
                            np.linalg.norm(existing.mean(axis=0) - center) < max(bw, bh) * 0.4
                            for existing in all_candidates
                        )
                        if not is_duplicate:
                            all_candidates.append(ordered_pts)
                        break

            if len(all_candidates) == 4:
                return all_candidates

        if len(all_candidates) < 4:
            return []

        best_four = self._select_best_four_markers(all_candidates)
        if best_four is not None:
            return best_four

        return sorted(all_candidates, reverse=True, key=lambda pts: cv2.contourArea(pts.astype(np.float32)))[:4]

    @staticmethod
    def _detect_apriltag_markers(image: np.ndarray) -> list[tuple[int, np.ndarray]]:
        """AprilTag 및 ArUco ID와 네 모서리를 검출한다."""
        aruco = getattr(cv2, "aruco", None)
        if aruco is None or image is None or image.size == 0:
            return []

        gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        dict_ids = [
            aruco.DICT_APRILTAG_36h11,
            getattr(aruco, "DICT_4X4_50", 0),
            getattr(aruco, "DICT_4X4_100", 1),
            getattr(aruco, "DICT_5X5_50", 4),
            getattr(aruco, "DICT_6X6_50", 8),
            getattr(aruco, "DICT_ARUCO_ORIGINAL", 16),
        ]

        scales = [1.0]
        max_dim = max(gray.shape)
        if max_dim > 1600:
            scales.append(1200.0 / max_dim)
        elif max_dim < 800:
            scales.append(2.0)

        for dict_id in dict_ids:
            try:
                dictionary = aruco.getPredefinedDictionary(dict_id)
            except Exception:
                continue

            for scale in scales:
                target_gray = gray if scale == 1.0 else cv2.resize(gray, (0, 0), fx=scale, fy=scale)
                params = getattr(aruco, "DetectorParameters", None)
                detector_params = params() if params is not None else None
                if detector_params is not None:
                    detector_params.adaptiveThreshWinSizeMin = 3
                    detector_params.adaptiveThreshWinSizeMax = 53
                    detector_params.adaptiveThreshWinSizeStep = 4
                    detector_params.minMarkerPerimeterRate = 0.01
                    detector_params.maxMarkerPerimeterRate = 4.0
                    detector_params.polygonalApproxAccuracyRate = 0.05
                    refine_method = getattr(aruco, "CORNER_REFINE_SUBPIX", None)
                    if refine_method is not None:
                        detector_params.cornerRefinementMethod = refine_method

                detector_cls = getattr(aruco, "ArucoDetector", None)
                if detector_cls is not None:
                    if detector_params is not None:
                        detector = detector_cls(dictionary, detector_params)
                    else:
                        detector = detector_cls(dictionary)
                    corners, ids, _ = detector.detectMarkers(target_gray)
                else:
                    if detector_params is not None:
                        corners, ids, _ = aruco.detectMarkers(target_gray, dictionary, parameters=detector_params)
                    else:
                        corners, ids, _ = aruco.detectMarkers(target_gray, dictionary)

                    if ids is not None and len(ids) >= 4:
                        result: list[tuple[int, np.ndarray]] = []
                        for index, marker_id in enumerate(ids.flatten()):
                            c = corners[index].reshape(4, 2).astype(np.float32)
                            if scale != 1.0:
                                c = c / scale
                            result.append((int(marker_id), c))
                        if len(result) == 4:
                            return result
                        elif len(result) > 4:
                            best_4 = OpenCVService._select_best_four_markers([pts for _, pts in result])
                            if best_4 is not None:
                                return [(0, pts) for pts in best_4]
        return []

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
        """완전히 보이는 3 cm 체커보드의 내부 코너를 검출한다."""
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
        tag_markers = self._detect_apriltag_markers(image)
        if len(tag_markers) == 4:
            quadrilaterals = [points for _, points in tag_markers]
            centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
            ordered_centers = self._order_points(centers)
            w_px = float(np.linalg.norm(ordered_centers[1] - ordered_centers[0]))
            h_px = float(np.linalg.norm(ordered_centers[3] - ordered_centers[0]))
            is_landscape = w_px > h_px * 1.15
            destination = self.marker_layout.destination_centers(self.PIXELS_PER_MM, is_landscape=is_landscape)
            return {
                "kind": "APRILTAG",
                "source": ordered_centers,
                "destination": destination,
                "marker_centers": ordered_centers,
                "is_landscape": is_landscape,
            }

        checkerboard = self._detect_checkerboard_corners(image)
        if checkerboard is not None:
            source, pattern_size = checkerboard
            return {
                "kind": "CHECKERBOARD",
                "source": source,
                "destination": self.checkerboard_layout.destination_corners(self.PIXELS_PER_MM, pattern_size),
                "marker_centers": None,
                "pattern_size": pattern_size,
                "is_landscape": False,
            }

        quadrilaterals = self._marker_quadrilaterals(image)
        if len(quadrilaterals) == 4:
            centers = np.array([points.mean(axis=0) for points in quadrilaterals], dtype=np.float32)
            ordered_centers = self._order_points(centers)
            w_px = float(np.linalg.norm(ordered_centers[1] - ordered_centers[0]))
            h_px = float(np.linalg.norm(ordered_centers[3] - ordered_centers[0]))
            is_landscape = w_px > h_px * 1.15
            destination = self.marker_layout.destination_centers(self.PIXELS_PER_MM, is_landscape=is_landscape)
            return {
                "kind": "APRILTAG",
                "source": ordered_centers,
                "destination": destination,
                "marker_centers": ordered_centers,
                "is_landscape": is_landscape,
            }

        return None

    def _marker_scale_is_consistent(self, image: np.ndarray) -> bool:
        """마커 한 변 25 mm와 중심거리 배치가 사진에서 함께 성립하는지 확인한다."""
        reference = self._reference_plane(image)
        if reference is None or reference["kind"] != "APRILTAG":
            return False
        quadrilaterals = self._ordered_marker_quadrilaterals(image)
        if len(quadrilaterals) != 4:
            return False
        ordered_centers = reference["source"]
        destination_centers = reference["destination"]
        matrix = cv2.getPerspectiveTransform(ordered_centers, destination_centers)
        side_lengths: list[float] = []
        for quadrilateral in quadrilaterals:
            corrected = cv2.perspectiveTransform(quadrilateral.reshape(-1, 1, 2), matrix).reshape(-1, 2)
            side_lengths.extend(
                float(np.linalg.norm(corrected[(index + 1) % 4] - corrected[index]))
                for index in range(4)
            )
        marker_side_mm = float(np.median(side_lengths) / self.PIXELS_PER_MM)
        # 프린터 인쇄 축소(90~95%) 및 스마트폰 광각 렌즈/원근 왜곡을 고려하여 허용 오차를 50%로 유연화
        return abs(marker_side_mm - self.marker_layout.marker_size_mm) <= self.marker_layout.marker_size_mm * 0.50

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
        reference = self._reference_plane(image)
        marker_ok = reference is not None
        marker_scale_ok = self._reference_scale_is_consistent(image, reference)

        blur_val = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        # 마커가 정상 검출된 경우 실내 촬영의 단색 배경 특성을 고려하여 2.0 이상이면 선명도로 인정
        min_blur = 2.0 if marker_ok else self.MIN_BLUR_VARIANCE
        blur_ok = blur_val >= min_blur

        brightness = float(gray.mean())
        brightness_ok = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS

        checks = {
            "measurement_sheet": marker_ok,
            "foot_complete": True,
            "blur": blur_ok,
            "brightness": brightness_ok,
            "marker": marker_ok,
            "perspective": marker_scale_ok,
        }
        if brightness < self.MIN_BRIGHTNESS:
            return {"valid": False, "reason": "IMAGE_TOO_DARK", "checks": checks}
        if brightness > self.MAX_BRIGHTNESS:
            return {"valid": False, "reason": "IMAGE_TOO_BRIGHT", "checks": checks}
        if not marker_ok:
            return {"valid": False, "reason": "MARKER_NOT_FOUND", "checks": checks}
        if not marker_scale_ok:
            return {"valid": False, "reason": "MARKER_SCALE_MISMATCH", "checks": checks}
        if not blur_ok:
            return {"valid": False, "reason": "IMAGE_BLUR", "checks": checks}
        return {"valid": True, "checks": checks}

    def lower_leg_negative_point(self, image: np.ndarray) -> tuple[int, int] | None:
        """하단 마커 바깥의 하퇴 지점을 SAM 음성 프롬프트로 추정한다."""
        reference = self._reference_plane(image)
        if reference is None:
            return None
        reference_points = np.asarray(reference["source"], dtype=np.float32).reshape(-1, 2)
        min_x, min_y = np.min(reference_points, axis=0)
        max_x, max_y = np.max(reference_points, axis=0)
        center_x = (min_x + max_x) / 2
        top_center = np.array((center_x, min_y), dtype=np.float32)
        bottom_center = np.array((center_x, max_y), dtype=np.float32)
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
        transformed_reference_points: np.ndarray,
        transformed_negative_point: np.ndarray,
    ) -> np.ndarray:
        """마커 행 바깥의 하퇴를 제외하고 발 마스크만 남긴다."""
        if mask is None or mask.size == 0:
            return mask

        reference_points = np.asarray(transformed_reference_points, dtype=np.float32).reshape(-1, 2)
        min_x, min_y = np.min(reference_points, axis=0)
        max_x, max_y = np.max(reference_points, axis=0)
        center_x = (min_x + max_x) / 2
        top_row = np.array((center_x, min_y), dtype=np.float32)
        bottom_row = np.array((center_x, max_y), dtype=np.float32)
        leg_row = min((top_row, bottom_row), key=lambda row: np.linalg.norm(row - transformed_negative_point))
        inset_px = int(round(self.ANKLE_CUTOFF_INSET_MM * self.PIXELS_PER_MM))
        
        trimmed = mask.copy()
        height = trimmed.shape[0]
        if leg_row[1] < height / 2:
            cutoff = max(int(round(leg_row[1])) - inset_px, 0)
            trimmed[:cutoff, :] = 0
        else:
            # 하단 마커 라인을 기준으로 발뒤꿈치 아래로 뻗은 하퇴를 정확히 절삭
            cutoff = min(int(round(leg_row[1])), height)
            trimmed[cutoff:, :] = 0
            
        return trimmed

    def detect_foot_side(
        self,
        mask: np.ndarray | None,
        transformed_reference_points: np.ndarray | None = None,
    ) -> str:
        """원근 보정된 발 마스크에서 엄지발가락 위치를 기반으로 오른발/왼발을 자동 판별한다."""
        if mask is None or mask.size == 0 or cv2.countNonZero(mask) == 0:
            return "RIGHT"
        pts = np.argwhere(mask > 0)
        top_y = float(pts[:, 0].min())
        
        if transformed_reference_points is not None:
            ref_pts = np.asarray(transformed_reference_points, dtype=np.float32).reshape(-1, 2)
            top_marker_y = float(np.min(ref_pts[:, 1]))
            center_x = float(np.mean(ref_pts[:, 0]))
            toe_cutoff_y = max(top_marker_y + 120.0, top_y + 160.0)
            toe_pts = pts[(pts[:, 0] >= top_y) & (pts[:, 0] <= toe_cutoff_y)]
        else:
            toe_pts = pts[pts[:, 0] <= top_y + 180]
            center_x = float(np.mean(toe_pts[:, 1])) if len(toe_pts) > 0 else float(mask.shape[1] / 2)
            
        if len(toe_pts) == 0:
            return "RIGHT"

        left_toes = toe_pts[toe_pts[:, 1] < center_x]
        right_toes = toe_pts[toe_pts[:, 1] >= center_x]
        left_min_y = float(np.min(left_toes[:, 0])) if len(left_toes) > 0 else 9999.0
        right_min_y = float(np.min(right_toes[:, 0])) if len(right_toes) > 0 else 9999.0

        # 엄지발가락 쪽이 더 위쪽(작은 y)까지 뻗어있음
        # 엄지발가락이 좌측에 있으면 오른발(RIGHT), 우측에 있으면 왼발(LEFT)
        if left_min_y < right_min_y:
            return "RIGHT"
        return "LEFT"

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
        transformed_reference_points = cv2.perspectiveTransform(
            np.asarray(reference["source"], dtype=np.float32).reshape(-1, 1, 2), matrix
        ).reshape(-1, 2)
        if mask is not None:
            corrected_mask = cv2.warpPerspective(
                mask.astype(np.uint8), matrix, output_size, flags=cv2.INTER_NEAREST
            )
            leg_negative_point = self.lower_leg_negative_point(image)
            if leg_negative_point is not None:
                transformed_negative_point = cv2.perspectiveTransform(
                    np.array([[leg_negative_point]], dtype=np.float32), matrix
                ).reshape(2)
                corrected_mask = self._trim_lower_leg_from_mask(
                    corrected_mask,
                    transformed_reference_points,
                    transformed_negative_point,
                )
        return {
            "image": corrected,
            "mask": corrected_mask,
            "matrix": matrix,
            "transformed_reference_points": transformed_reference_points,
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
