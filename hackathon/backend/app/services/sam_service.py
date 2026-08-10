"""Segmentation Anything integration for a user-selected foot point."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np


class SegmentationError(RuntimeError):
    """Raised when SAM cannot produce a usable foot mask."""


class SAMService:
    """Creates a foot mask using the supplied point as a positive SAM prompt.

    A predictor can be injected in tests.  In production ``model_path`` must point
    to a SAM checkpoint; model weights are deliberately never stored in this repo.
    """

    def __init__(self, model_path: str | Path | None = None, model_type: str = "vit_b", predictor: Any | None = None) -> None:
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
        except ImportError as exc:
            raise SegmentationError("SEGMENTATION_FAILED: install segment-anything and torch") from exc
        try:
            model = sam_model_registry[self.model_type](checkpoint=str(self.model_path))
            self._predictor = SamPredictor(model)
            return self._predictor
        except Exception as exc:  # model/device errors are normalized for the caller
            raise SegmentationError("SEGMENTATION_FAILED: SAM model could not be loaded") from exc

    def segment(self, image: np.ndarray, point_x: int, point_y: int) -> dict[str, Any]:
        if image is None or image.size == 0:
            raise SegmentationError("SEGMENTATION_FAILED: image is empty")
        height, width = image.shape[:2]
        if not 0 <= point_x < width or not 0 <= point_y < height:
            raise SegmentationError("SEGMENTATION_FAILED: point is outside the image")

        predictor = self._get_predictor()
        rgb_image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB) if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        try:
            predictor.set_image(rgb_image)
            masks, scores, _ = predictor.predict(
                point_coords=np.array([[point_x, point_y]], dtype=np.float32),
                point_labels=np.array([1], dtype=np.int32),
                multimask_output=True,
            )
        except Exception as exc:
            raise SegmentationError("SEGMENTATION_FAILED: SAM inference failed") from exc

        if masks is None or len(masks) == 0:
            raise SegmentationError("SEGMENTATION_FAILED: no mask returned")
        masks = np.asarray(masks)
        scores = np.asarray(scores, dtype=np.float32)
        if masks.ndim != 3 or scores.ndim != 1 or len(masks) != len(scores):
            raise SegmentationError("SEGMENTATION_FAILED: invalid SAM response")
        containing = [candidate for candidate, mask in enumerate(masks) if bool(mask[point_y, point_x])]
        index = max(containing, key=lambda candidate: float(scores[candidate])) if containing else int(np.argmax(scores))
        mask = (np.asarray(masks[index]) > 0).astype(np.uint8)
        if cv2.countNonZero(mask) == 0:
            raise SegmentationError("SEGMENTATION_FAILED: empty mask returned")
        x, y, box_width, box_height = cv2.boundingRect(mask)
        return {
            "mask": mask,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(box_width), "height": int(box_height)},
            "segmentation_confidence": float(scores[index]),
        }
