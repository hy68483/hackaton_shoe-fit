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
        self.assertFalse(result["outlier_rejected"])
        self.assertEqual(result["accepted_measurement_indices"], [0, 1, 2])

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
        self.assertEqual(result["correction_reason"], "NO_CONSENSUS")

    def test_requests_retake_when_width_spread_is_large(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 252.0, "foot_width_mm": 101.0},
                {"foot_length_mm": 252.5, "foot_width_mm": 108.0},
                {"foot_length_mm": 253.0, "foot_width_mm": 103.0},
            ]
        )

        self.assertEqual(result["corrected_foot_width_mm"], 102.0)
        self.assertFalse(result["retake_required"])
        self.assertTrue(result["outlier_rejected"])
        self.assertEqual(result["accepted_measurement_indices"], [0, 2])
        self.assertEqual(result["correction_reason"], "OUTLIER_REJECTED")

    def test_rejects_one_length_outlier_and_uses_the_closest_pair(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 252.0, "foot_width_mm": 101.0},
                {"foot_length_mm": 254.0, "foot_width_mm": 102.0},
                {"foot_length_mm": 310.3, "foot_width_mm": 102.8},
            ]
        )

        self.assertEqual(result["corrected_foot_length_mm"], 253.0)
        self.assertEqual(result["corrected_foot_width_mm"], 101.5)
        self.assertFalse(result["retake_required"])
        self.assertTrue(result["outlier_rejected"])
        self.assertEqual(result["excluded_measurement_indices"], [2])

    def test_rejects_consistent_but_physically_impossible_measurements(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 409.0, "foot_width_mm": 101.0},
                {"foot_length_mm": 410.0, "foot_width_mm": 102.0},
                {"foot_length_mm": 411.0, "foot_width_mm": 102.5},
            ]
        )

        self.assertTrue(result["retake_required"])
        self.assertEqual(result["accepted_measurement_indices"], [])
        self.assertEqual(result["implausible_measurement_indices"], [0, 1, 2])
        self.assertEqual(result["correction_reason"], "IMPLAUSIBLE_MEASUREMENT")

    def test_excludes_an_impossible_value_before_pair_consensus(self) -> None:
        result = MeasurementService.aggregate_measurements(
            [
                {"foot_length_mm": 252.0, "foot_width_mm": 101.0},
                {"foot_length_mm": 254.0, "foot_width_mm": 102.0},
                {"foot_length_mm": 410.0, "foot_width_mm": 102.0},
            ]
        )

        self.assertFalse(result["retake_required"])
        self.assertEqual(result["corrected_foot_length_mm"], 253.0)
        self.assertEqual(result["accepted_measurement_indices"], [0, 1])
        self.assertEqual(result["implausible_measurement_indices"], [2])
