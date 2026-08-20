from unittest import TestCase

from app.services.measurement_service import MeasurementService


class MeasurementAggregationTests(TestCase):
    def test_uses_median_for_consistent_multi_capture_results(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 252.3, "foot_width_mm": 108.6},
                {"foot_length_mm": 252.7, "foot_width_mm": 107.9},
                {"foot_length_mm": 253.0, "foot_width_mm": 108.0},
            ]
        )

        self.assertEqual(result["corrected_foot_length_mm"], 252.7)
        self.assertEqual(result["corrected_foot_width_mm"], 108.0)
        self.assertEqual(result["length_correction_mm"], 0.0)
        self.assertTrue(result["correction_applied"])
        self.assertFalse(result["retake_required"])

    def test_uses_median_and_requests_retake_when_length_spread_is_large(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 199.9, "foot_width_mm": 106.5},
                {"foot_length_mm": 251.4, "foot_width_mm": 106.8},
                {"foot_length_mm": 225.0, "foot_width_mm": 106.7},
            ]
        )

        self.assertEqual(result["raw_average_foot_length_mm"], 225.4)
        self.assertEqual(result["corrected_foot_length_mm"], 225.0)
        self.assertEqual(result["length_spread_mm"], 51.5)
        self.assertEqual(result["length_correction_mm"], -0.4)
        self.assertTrue(result["correction_applied"])
        self.assertTrue(result["retake_required"])
        self.assertEqual(result["correction_reason"], "LENGTH_SPREAD_EXCEEDED")

    def test_requests_retake_when_width_spread_is_large(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 252.0, "foot_width_mm": 101.0},
                {"foot_length_mm": 252.5, "foot_width_mm": 108.0},
                {"foot_length_mm": 253.0, "foot_width_mm": 103.0},
            ]
        )

        self.assertEqual(result["corrected_foot_width_mm"], 103.0)
        self.assertTrue(result["retake_required"])
        self.assertEqual(result["correction_reason"], "WIDTH_SPREAD_EXCEEDED")
