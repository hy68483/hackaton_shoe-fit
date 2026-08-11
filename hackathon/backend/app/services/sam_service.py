"""사용자가 선택한 발 좌표를 SAM에 전달해 발 영역을 분할한다."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np


class SegmentationError(RuntimeError):
    """SAM이 측정 가능한 발 mask를 만들지 못했을 때 발생한다."""


class SAMService:
    """선택 좌표를 positive prompt로 사용해 발 mask를 생성한다.

    테스트에서는 predictor를 주입하고, 운영에서는 model_path의 checkpoint를
    사용한다. 모델 가중치 파일은 저장소에 포함하지 않는다.
    """

    def __init__(self, model_path: str | Path | None = None, model_type: str = "vit_b", predictor: Any | None = None) -> None:
        self.model_path = Path(model_path) if model_path else None
        self.model_type = model_type
        self._predictor = predictor

    def _get_predictor(self) -> Any:
        # 테스트에서 주입한 predictor가 있으면 모델을 새로 불러오지 않는다.
        if self._predictor is not None:
            return self._predictor
        # checkpoint가 없으면 실제 SAM 추론을 시작할 수 없다.
        if self.model_path is None or not self.model_path.is_file():
            raise SegmentationError("SEGMENTATION_FAILED: SAM model checkpoint is not configured")
        try:
            from segment_anything import SamPredictor, sam_model_registry
        except ImportError as exc:
            raise SegmentationError("SEGMENTATION_FAILED: install segment-anything and torch") from exc
        try:
            # 지정한 모델 종류와 checkpoint로 SAM predictor를 한 번만 생성한다.
            model = sam_model_registry[self.model_type](checkpoint=str(self.model_path))
            self._predictor = SamPredictor(model)
            return self._predictor
        except Exception as exc:
            # 모델·장치 오류를 호출부가 처리할 수 있는 하나의 실패 코드로 통일한다.
            raise SegmentationError("SEGMENTATION_FAILED: SAM model could not be loaded") from exc

    def segment(self, image: np.ndarray, point_x: int, point_y: int) -> dict[str, Any]:
        # 비어 있는 이미지와 이미지 밖의 좌표는 SAM에 전달하지 않는다.
        if image is None or image.size == 0:
            raise SegmentationError("SEGMENTATION_FAILED: image is empty")
        height, width = image.shape[:2]
        if not 0 <= point_x < width or not 0 <= point_y < height:
            raise SegmentationError("SEGMENTATION_FAILED: point is outside the image")

        predictor = self._get_predictor()
        # OpenCV의 BGR/Gray 이미지를 SAM이 기대하는 RGB 형식으로 변환한다.
        rgb_image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB) if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        try:
            # 사용자가 누른 한 점을 positive point(label=1)로 전달한다.
            predictor.set_image(rgb_image)
            masks, scores, _ = predictor.predict(
                point_coords=np.array([[point_x, point_y]], dtype=np.float32),
                point_labels=np.array([1], dtype=np.int32),
                multimask_output=True,
            )
        except Exception as exc:
            raise SegmentationError("SEGMENTATION_FAILED: SAM inference failed") from exc

        # SAM 응답이 비어 있거나 mask/score 구조가 맞지 않으면 측정을 중단한다.
        if masks is None or len(masks) == 0:
            raise SegmentationError("SEGMENTATION_FAILED: no mask returned")
        masks = np.asarray(masks)
        scores = np.asarray(scores, dtype=np.float32)
        if masks.ndim != 3 or scores.ndim != 1 or len(masks) != len(scores):
            raise SegmentationError("SEGMENTATION_FAILED: invalid SAM response")
        # 여러 mask 중 사용자가 누른 점을 포함하는 후보를 우선으로 고른다.
        containing = [candidate for candidate, mask in enumerate(masks) if bool(mask[point_y, point_x])]
        index = max(containing, key=lambda candidate: float(scores[candidate])) if containing else int(np.argmax(scores))
        # OpenCV contour 연산에 사용할 수 있도록 0/1 uint8 mask로 정규화한다.
        mask = (np.asarray(masks[index]) > 0).astype(np.uint8)
        if cv2.countNonZero(mask) == 0:
            raise SegmentationError("SEGMENTATION_FAILED: empty mask returned")
        # 선택된 발 mask에서 bounding box와 SAM confidence를 함께 반환한다.
        x, y, box_width, box_height = cv2.boundingRect(mask)
        return {
            "mask": mask,
            "bounding_box": {"x": int(x), "y": int(y), "width": int(box_width), "height": int(box_height)},
            "segmentation_confidence": float(scores[index]),
        }
