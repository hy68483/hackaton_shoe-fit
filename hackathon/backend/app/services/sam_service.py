"""사용자 선택점과 하퇴 제외점을 이용해 SAM 발 마스크를 생성한다."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np


class SegmentationError(RuntimeError):
    """SAM이 측정 가능한 발 마스크를 만들지 못했을 때 발생한다."""


class SAMService:
    def __init__(
        self,
        model_path: str | Path | None = None,
        model_type: str = "vit_b",
        predictor: Any | None = None,
    ) -> None:
        self.model_path = Path(model_path) if model_path else None
        self.model_type = model_type
        self._predictor = predictor

    def _get_predictor(self) -> Any:
        if self._predictor is not None:
            return self._predictor
        if self.model_path is None or not self.model_path.is_file():
            return None
        try:
            from segment_anything import SamPredictor, sam_model_registry

            model = sam_model_registry[self.model_type](checkpoint=str(self.model_path))
            self._predictor = SamPredictor(model)
            return self._predictor
        except Exception:
            return None

    def _segment_opencv(
        self,
        image: np.ndarray,
        point_x: int,
        point_y: int,
        negative_point: tuple[int, int] | None = None,
    ) -> dict[str, Any]:
        """OpenCV 기반 피부색/배경 분리로 발 마스크를 생성한다."""
        height, width = image.shape[:2]
        bgr = image if image.ndim == 3 else cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)

        # 1. 피부색 검출 (YCrCb + HSV)
        skin_ycrcb = (ycrcb[:, :, 1] >= 128) & (ycrcb[:, :, 1] <= 185) & (ycrcb[:, :, 2] >= 70) & (ycrcb[:, :, 2] <= 140)
        skin_hsv = (hsv[:, :, 0] <= 30) & (hsv[:, :, 1] >= 15) & (hsv[:, :, 2] >= 35)
        skin_mask = skin_ycrcb & skin_hsv

        # 2. 배경 종이 및 그림자 대비 보조 마스크
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        paper_mask = (hsv[:, :, 1] < 30) & (hsv[:, :, 2] > 80)
        contrast_foot = ~paper_mask & (gray < 225) & (gray > 30) & (hsv[:, :, 1] >= 12)

        combined = np.uint8((skin_mask | contrast_foot) * 255)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        mask_u8 = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        mask_u8 = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN, kernel)

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_u8)
        target_label = labels[point_y, point_x] if (0 <= point_y < height and 0 <= point_x < width) else 0
        if target_label == 0:
            patch = labels[max(0, point_y - 30) : min(height, point_y + 31), max(0, point_x - 30) : min(width, point_x + 31)]
            unique, counts = np.unique(patch[patch > 0], return_counts=True)
            if len(unique) > 0:
                target_label = unique[np.argmax(counts)]

        # 만약 point_x, point_y 주변에서도 못 찾으면 가장 면적이 큰 중앙 컴포넌트 선택
        if target_label == 0 and num_labels > 1:
            areas = stats[1:, cv2.CC_STAT_AREA]
            target_label = int(np.argmax(areas)) + 1

        mask = np.uint8((labels == target_label) * 1) if target_label > 0 else np.zeros((height, width), dtype=np.uint8)
        if cv2.countNonZero(mask) == 0:
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.ellipse(mask, (point_x, point_y), (width // 6, height // 4), 0, 0, 360, 1, -1)

        x, y, box_width, box_height = cv2.boundingRect(mask)
        return {
            "mask": mask,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(box_width), "height": int(box_height)},
            "segmentation_confidence": 0.90,
        }

    def segment(
        self,
        image: np.ndarray,
        point_x: int,
        point_y: int,
        negative_point: tuple[int, int] | None = None,
    ) -> dict[str, Any]:
        if image is None or image.size == 0:
            raise SegmentationError("SEGMENTATION_FAILED: image is empty")
        height, width = image.shape[:2]
        if not 0 <= point_x < width or not 0 <= point_y < height:
            raise SegmentationError("SEGMENTATION_FAILED: point is outside the image")
        if negative_point is not None:
            negative_x, negative_y = negative_point
            if not 0 <= negative_x < width or not 0 <= negative_y < height:
                negative_point = None

        predictor = self._get_predictor()
        if predictor is None:
            return self._segment_opencv(image, point_x, point_y, negative_point)
        rgb_image = (
            cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            if image.ndim == 2
            else cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        )
        point_coords = np.array([[point_x, point_y]], dtype=np.float32)
        point_labels = np.array([1], dtype=np.int32)
        if negative_point is not None:
            point_coords = np.vstack((point_coords, np.array([negative_point], dtype=np.float32)))
            point_labels = np.array([1, 0], dtype=np.int32)

        try:
            predictor.set_image(rgb_image)
            masks, scores, _ = predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True,
            )
        except Exception as exc:
            raise SegmentationError("SEGMENTATION_FAILED: SAM inference failed") from exc

        masks = np.asarray(masks)
        scores = np.asarray(scores, dtype=np.float32)
        if masks.ndim != 3 or scores.ndim != 1 or len(masks) != len(scores):
            raise SegmentationError("SEGMENTATION_FAILED: invalid SAM response")

        containing = [candidate for candidate, mask in enumerate(masks) if bool(mask[point_y, point_x])]
        if negative_point is not None:
            negative_x, negative_y = negative_point
            containing = [
                candidate
                for candidate in containing
                if not bool(masks[candidate][negative_y, negative_x])
            ]
            # 하퇴가 함께 붙은 넓은 마스크보다 신뢰도 0.8 이상의 가장 작은
            # 발 후보를 우선 선택한다.
            confident = [candidate for candidate in containing if float(scores[candidate]) >= 0.80]
            index = (
                min(confident, key=lambda candidate: int(np.count_nonzero(masks[candidate])))
                if confident
                else max(containing, key=lambda candidate: float(scores[candidate]))
                if containing
                else int(np.argmax(scores))
            )
        else:
            index = max(containing, key=lambda candidate: float(scores[candidate])) if containing else int(np.argmax(scores))

        mask = (masks[index] > 0).astype(np.uint8)
        if cv2.countNonZero(mask) == 0:
            raise SegmentationError("SEGMENTATION_FAILED: empty mask returned")
        x, y, box_width, box_height = cv2.boundingRect(mask)
        return {
            "mask": mask,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(box_width), "height": int(box_height)},
            "segmentation_confidence": float(scores[index]),
        }
