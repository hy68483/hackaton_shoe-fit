import unittest

import cv2
import numpy as np

from app.services.opencv_service import OpenCVService


class OpenCVServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = OpenCVService()
        self.image = np.full((1000, 700, 3), 230, dtype=np.uint8)
        for center in ((100, 120), (540, 130), (550, 820), (90, 790)):
            x, y = center
            cv2.rectangle(self.image, (x - 35, y - 35), (x + 35, y + 35), (20, 20, 20), -1)

    def test_detects_and_orders_four_custom_markers(self) -> None:
        centers = self.service.detect_marker_centers(self.image)

        self.assertIsNotNone(centers)
        np.testing.assert_allclose(
            centers,
            np.array([[100, 120], [540, 130], [550, 820], [90, 790]], dtype=np.float32),
            atol=2,
        )

    def test_marker_layout_enables_validation_and_perspective_correction(self) -> None:
        validation = self.service.validate_image(self.image)
        corrected = self.service.correct_perspective(self.image)

        self.assertTrue(validation["valid"])
        self.assertEqual(corrected["scale_mm_per_px"], 0.2)
        self.assertGreater(corrected["image"].shape[0], 0)

    def test_measures_mask_in_millimetres(self) -> None:
        mask = np.zeros((400, 800), dtype=np.uint8)
        cv2.rectangle(mask, (100, 100), (600, 350), 1, -1)

        measurement = self.service.measure_mask(mask, scale_mm_per_px=0.2)

        self.assertAlmostEqual(measurement["foot_length_mm"], 100.0, delta=0.5)
        self.assertAlmostEqual(measurement["foot_width_mm"], 50.0, delta=0.5)


if __name__ == "__main__":
    unittest.main()
