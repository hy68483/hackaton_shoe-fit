import unittest

import cv2
import numpy as np

from app.services.opencv_service import OpenCVService


class OpenCVServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = OpenCVService()
        self.image = np.full((1300, 900, 3), 230, dtype=np.uint8)
        # 5 px/mm 기준으로 중심 간 가로 85 mm, 세로 170 mm인 AprilTag 배치다.
        for center in ((150, 150), (575, 150), (575, 1000), (150, 1000)):
            x, y = center
            cv2.rectangle(self.image, (x - 100, y - 100), (x + 100, y + 100), (20, 20, 20), -1)

    def test_detects_and_orders_four_custom_markers(self) -> None:
        centers = self.service.detect_marker_centers(self.image)

        self.assertIsNotNone(centers)
        np.testing.assert_allclose(
            centers,
            np.array([[150, 150], [575, 150], [575, 1000], [150, 1000]], dtype=np.float32),
            atol=2,
        )

    def test_marker_layout_enables_validation_and_perspective_correction(self) -> None:
        validation = self.service.validate_image(self.image)
        corrected = self.service.correct_perspective(self.image)

        self.assertTrue(validation["valid"])
        self.assertEqual(corrected["scale_mm_per_px"], 0.2)
        self.assertGreater(corrected["image"].shape[0], 0)

    def test_estimates_lower_leg_negative_point_from_bottom_markers(self) -> None:
        negative_point = self.service.lower_leg_negative_point(self.image)

        self.assertEqual(negative_point, (362, 1170))

    def test_marker_layout_uses_the_specified_physical_distances(self) -> None:
        destination = self.service.marker_layout.destination_centers(pixels_per_mm=5.0)

        np.testing.assert_array_equal(
            destination,
            np.array([[0, 0], [425, 0], [425, 850], [0, 850]], dtype=np.float32),
        )

    def test_rejects_a_marker_with_an_obscured_corner(self) -> None:
        image = self.image.copy()
        cv2.rectangle(image, (40, 40), (160, 160), (230, 230, 230), -1)

        self.assertIsNone(self.service.detect_marker_centers(image))
        self.assertEqual(self.service.validate_image(image)["reason"], "MARKER_NOT_FOUND")

    def test_measures_mask_in_millimetres(self) -> None:
        mask = np.zeros((400, 800), dtype=np.uint8)
        cv2.rectangle(mask, (100, 100), (600, 350), 1, -1)

        measurement = self.service.measure_mask(mask, scale_mm_per_px=0.2)

        self.assertAlmostEqual(measurement["foot_length_mm"], 100.0, delta=0.5)
        self.assertAlmostEqual(measurement["foot_width_mm"], 50.0, delta=0.5)


if __name__ == "__main__":
    unittest.main()
