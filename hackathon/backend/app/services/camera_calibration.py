"""단일 사진 2.5D 보정에 사용하는 카메라 파라미터를 읽는다."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np


class CameraCalibrationError(ValueError):
    """카메라 보정 파일 형식이 올바르지 않을 때 발생한다."""


@dataclass(frozen=True)
class CameraCalibration:
    """OpenCV 보정 결과와 발 표면의 유효 높이(mm)다."""

    camera_matrix: np.ndarray
    distortion_coefficients: np.ndarray
    length_effective_height_mm: float = 8.0
    width_effective_height_mm: float = 18.0
    version: str = "unversioned"
    image_size_px: tuple[int, int] | None = None

    def __post_init__(self) -> None:
        camera_matrix = np.asarray(self.camera_matrix, dtype=np.float64)
        distortion = np.asarray(self.distortion_coefficients, dtype=np.float64).reshape(-1, 1)
        if camera_matrix.shape != (3, 3):
            raise CameraCalibrationError("camera_matrix must be a 3x3 matrix")
        if distortion.size not in {4, 5, 8, 12, 14}:
            raise CameraCalibrationError("distortion_coefficients must contain OpenCV distortion values")
        if self.length_effective_height_mm < 0 or self.width_effective_height_mm < 0:
            raise CameraCalibrationError("effective heights must be non-negative")
        image_size = None
        if self.image_size_px is not None:
            if len(self.image_size_px) != 2 or any(int(value) <= 0 for value in self.image_size_px):
                raise CameraCalibrationError("image_size_px must contain positive width and height")
            image_size = tuple(int(value) for value in self.image_size_px)
        object.__setattr__(self, "camera_matrix", camera_matrix)
        object.__setattr__(self, "distortion_coefficients", distortion)
        object.__setattr__(self, "image_size_px", image_size)

    @classmethod
    def from_file(cls, path: str | Path) -> "CameraCalibration":
        try:
            payload = json.loads(Path(path).read_text(encoding="utf-8"))
            return cls(
                camera_matrix=payload["camera_matrix"],
                distortion_coefficients=payload["distortion_coefficients"],
                length_effective_height_mm=float(payload.get("length_effective_height_mm", 8.0)),
                width_effective_height_mm=float(payload.get("width_effective_height_mm", 18.0)),
                version=str(payload.get("version", "unversioned")),
                image_size_px=payload.get("image_size_px"),
            )
        except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise CameraCalibrationError("invalid camera calibration file") from exc
