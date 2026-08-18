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
            raise SegmentationError("SEGMENTATION_FAILED: SAM model checkpoint is not configured")
        try:
            from segment_anything import SamPredictor, sam_model_registry

            model = sam_model_registry[self.model_type](checkpoint=str(self.model_path))
            self._predictor = SamPredictor(model)
            return self._predictor
        except Exception as exc:
            raise SegmentationError("SEGMENTATION_FAILED: SAM model could not be loaded") from exc

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
