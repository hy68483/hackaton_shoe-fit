"""Create the camera calibration JSON consumed by the 2.5D measurement path."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Calibrate one capture device from chessboard photos and write camera_calibration.json."
    )
    parser.add_argument("images", help="Glob for calibration photos, for example 'calibration/*.jpg'.")
    parser.add_argument("--columns", type=int, default=9, help="Number of inner chessboard corners across.")
    parser.add_argument("--rows", type=int, default=6, help="Number of inner chessboard corners down.")
    parser.add_argument("--square-size-mm", type=float, required=True, help="Measured chessboard square side in mm.")
    parser.add_argument(
        "--length-effective-height-mm",
        type=float,
        default=8.0,
        help="Initial effective height for foot-length correction; tune with known-length samples.",
    )
    parser.add_argument(
        "--width-effective-height-mm",
        type=float,
        default=18.0,
        help="Initial effective height for foot-width correction; tune with known-width samples.",
    )
    parser.add_argument("--output", default="camera_calibration.json", help="Output JSON path.")
    return parser.parse_args()


def main() -> int:
    args = parse_arguments()
    if args.columns < 2 or args.rows < 2 or args.square_size_mm <= 0:
        raise ValueError("columns, rows, and square-size-mm must be positive")
    if args.length_effective_height_mm < 0 or args.width_effective_height_mm < 0:
        raise ValueError("effective heights must be non-negative")

    image_paths = sorted(Path().glob(args.images))
    if not image_paths:
        raise ValueError("no calibration images matched the supplied glob")

    pattern_size = (args.columns, args.rows)
    object_template = np.zeros((args.columns * args.rows, 3), dtype=np.float32)
    object_template[:, :2] = (
        np.mgrid[0 : args.columns, 0 : args.rows].T.reshape(-1, 2) * args.square_size_mm
    )
    object_points: list[np.ndarray] = []
    image_points: list[np.ndarray] = []
    image_size: tuple[int, int] | None = None

    for image_path in image_paths:
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"SKIP unreadable: {image_path}")
            continue
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        found, corners = cv2.findChessboardCorners(
            gray,
            pattern_size,
            cv2.CALIB_CB_ADAPTIVE_THRESH | cv2.CALIB_CB_NORMALIZE_IMAGE,
        )
        if not found:
            print(f"SKIP no checkerboard: {image_path}")
            continue
        refined = cv2.cornerSubPix(
            gray,
            corners,
            (11, 11),
            (-1, -1),
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001),
        )
        object_points.append(object_template)
        image_points.append(refined)
        image_size = (gray.shape[1], gray.shape[0])
        print(f"USE {image_path}")

    if len(object_points) < 10 or image_size is None:
        raise ValueError("at least 10 readable checkerboard photos are required")

    rms_error, camera_matrix, distortion, _, _ = cv2.calibrateCamera(
        object_points,
        image_points,
        image_size,
        None,
        None,
    )
    payload = {
        "camera_matrix": camera_matrix.tolist(),
        "distortion_coefficients": distortion.reshape(-1).tolist(),
        "length_effective_height_mm": args.length_effective_height_mm,
        "width_effective_height_mm": args.width_effective_height_mm,
        "version": "chessboard-calibration-v1",
        "calibration_rms_error_px": round(float(rms_error), 4),
        "image_size_px": list(image_size),
        "valid_image_count": len(object_points),
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"CALIBRATION=PASS images={len(object_points)} rms_px={rms_error:.4f} output={output_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as error:
        print(f"CALIBRATION=FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)
