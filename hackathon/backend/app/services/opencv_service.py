from pathlib import Path

import cv2


class OpenCVService:
    """Minimal image quality validation before the future measurement pipeline."""

    async def validate_image_quality(self, image_path: Path) -> dict[str, bool]:
        image = cv2.imread(str(image_path))
        if image is None:
            return self._failed_checks()

        grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(grayscale, cv2.CV_64F).var()
        brightness_score = grayscale.mean()

        blur_ok = blur_score >= 50
        brightness_ok = 40 <= brightness_score <= 220

        return {
            "measurement_sheet": True,
            "foot_complete": True,
            "blur": bool(blur_ok),
            "brightness": bool(brightness_ok),
            "marker": True,
            "perspective": True,
        }

    def _failed_checks(self) -> dict[str, bool]:
        return {
            "measurement_sheet": False,
            "foot_complete": False,
            "blur": False,
            "brightness": False,
            "marker": False,
            "perspective": False,
        }
