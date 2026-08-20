from unittest import TestCase

import numpy as np

from app.services.sam_service import SAMService


class SlightlyOverconfidentPredictor:
    def set_image(self, image: np.ndarray) -> None:
        self.image = image

    def predict(self, **_: object) -> tuple[np.ndarray, np.ndarray, None]:
        mask = np.ones((1, *self.image.shape[:2]), dtype=np.uint8)
        scores = np.array([1.0003928], dtype=np.float32)
        return mask, scores, None


class SAMServiceTests(TestCase):
    def test_segmentation_confidence_is_clamped_to_probability_range(self) -> None:
        service = SAMService(predictor=SlightlyOverconfidentPredictor())
        image = np.zeros((20, 20, 3), dtype=np.uint8)

        result = service.segment(image, point_x=10, point_y=10)

        self.assertEqual(result["segmentation_confidence"], 1.0)
