import unittest

import cv2
import numpy as np

from app.services.camera_calibration import CameraCalibration
from app.services.opencv_service import OpenCVService


class OpenCVServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = OpenCVService()
        self.image = np.full((1500, 1100, 3), 230, dtype=np.uint8)
        # 5 px/mm 기준으로 중심 간 가로 130 mm, 세로 216 mm인 AprilTag 배치다.
        for center in ((200, 200), (850, 200), (850, 1280), (200, 1280)):
            x, y = center
            cv2.rectangle(self.image, (x - 62, y - 62), (x + 62, y + 62), (20, 20, 20), -1)

    def test_detects_and_orders_four_custom_markers(self) -> None:
        centers = self.service.detect_marker_centers(self.image)

        self.assertIsNotNone(centers)
        np.testing.assert_allclose(
            centers,
            np.array([[200, 200], [850, 200], [850, 1280], [200, 1280]], dtype=np.float32),
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

        self.assertEqual(negative_point, (525, 1496))

    def test_uses_skin_coloured_marker_side_as_the_lower_leg_direction(self) -> None:
        image = np.full((1500, 1100, 3), 230, dtype=np.uint8)
        for center in ((200, 350), (850, 350), (850, 1100), (200, 1100)):
            x, y = center
            cv2.rectangle(image, (x - 62, y - 62), (x + 62, y + 62), (20, 20, 20), -1)
        cv2.rectangle(image, (490, 165), (560, 235), (80, 100, 140), -1)

        self.assertEqual(self.service.lower_leg_negative_point(image), (525, 200))

    def test_removes_only_the_marker_outer_leg_region_from_corrected_mask(self) -> None:
        mask = np.ones((1_300, 700), dtype=np.uint8)
        transformed_markers = np.array([[25, 300], [675, 300], [675, 1_100], [25, 1_100]], dtype=np.float32)

        trimmed = self.service._trim_lower_leg_from_mask(
            mask,
            transformed_markers,
            np.array([350, 80], dtype=np.float32),
        )

        self.assertFalse(trimmed[:175].any())
        self.assertTrue(trimmed[175:].all())

    def test_marker_layout_uses_the_specified_physical_distances(self) -> None:
        destination = self.service.marker_layout.destination_centers(pixels_per_mm=5.0)

        np.testing.assert_array_equal(
            destination,
            np.array([[0, 0], [650, 0], [650, 1080], [0, 1080]], dtype=np.float32),
        )

    def test_rejects_a_marker_with_an_obscured_corner(self) -> None:
        image = self.image.copy()
        cv2.rectangle(image, (130, 130), (270, 270), (230, 230, 230), -1)

        self.assertIsNone(self.service.detect_marker_centers(image))
        self.assertEqual(self.service.validate_image(image)["reason"], "MARKER_NOT_FOUND")

    def test_measures_mask_in_millimetres(self) -> None:
        mask = np.zeros((400, 800), dtype=np.uint8)
        cv2.rectangle(mask, (100, 100), (600, 350), 1, -1)

        measurement = self.service.measure_mask(mask, scale_mm_per_px=0.2)

        self.assertAlmostEqual(measurement["foot_length_mm"], 100.0, delta=0.5)
        self.assertAlmostEqual(measurement["foot_width_mm"], 50.0, delta=0.5)

    def test_parallax_measurement_recovers_a_raised_foot_shape(self) -> None:
        camera_matrix = np.array([[1000.0, 0.0, 600.0], [0.0, 1000.0, 600.0], [0.0, 0.0, 1.0]])
        calibration = CameraCalibration(
            camera_matrix=camera_matrix,
            distortion_coefficients=np.zeros(5),
            length_effective_height_mm=20.0,
            width_effective_height_mm=20.0,
            version="synthetic-test",
        )
        service = OpenCVService(camera_calibration=calibration)
        image = np.full((1400, 1400, 3), 230, dtype=np.uint8)
        rotation_vector = np.zeros((3, 1), dtype=np.float64)
        translation_vector = np.array([[0.0], [0.0], [500.0]])
        centers = service.marker_layout.destination_centers(pixels_per_mm=1.0)
        for center in centers:
            corners = np.array(
                [
                    [center[0] - 12.5, center[1] - 12.5, 0.0],
                    [center[0] + 12.5, center[1] - 12.5, 0.0],
                    [center[0] + 12.5, center[1] + 12.5, 0.0],
                    [center[0] - 12.5, center[1] + 12.5, 0.0],
                ],
                dtype=np.float32,
            )
            projected, _ = cv2.projectPoints(corners, rotation_vector, translation_vector, camera_matrix, np.zeros(5))
            cv2.fillConvexPoly(image, np.rint(projected).astype(np.int32), (20, 20, 20))

        foot_corners = np.array(
            [[20.0, 30.0, -20.0], [110.0, 30.0, -20.0], [110.0, 280.0, -20.0], [20.0, 280.0, -20.0]],
            dtype=np.float32,
        )
        projected_foot, _ = cv2.projectPoints(
            foot_corners,
            rotation_vector,
            translation_vector,
            camera_matrix,
            np.zeros(5),
        )
        raw_mask = np.zeros(image.shape[:2], dtype=np.uint8)
        cv2.fillConvexPoly(raw_mask, np.rint(projected_foot).astype(np.int32), 1)
        corrected = service.correct_perspective(image)
        corrected_mask = cv2.warpPerspective(
            raw_mask,
            corrected["matrix"],
            (corrected["image"].shape[1], corrected["image"].shape[0]),
            flags=cv2.INTER_NEAREST,
        )

        planar = service.measure_mask(corrected_mask, corrected["scale_mm_per_px"])
        pose = service.estimate_camera_pose(image)
        self.assertIsNotNone(pose)
        compensated = service.measure_mask_with_parallax(corrected_mask, corrected["matrix"], pose)

        self.assertGreater(planar["foot_length_mm"], 255.0)
        self.assertAlmostEqual(compensated["foot_length_mm"], 250.0, delta=2.0)
        self.assertAlmostEqual(compensated["foot_width_mm"], 90.0, delta=2.0)


if __name__ == "__main__":
    unittest.main()
