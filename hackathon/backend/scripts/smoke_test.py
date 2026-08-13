import argparse
import json
import tempfile
import sys
import urllib.error
import urllib.request
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np


def main() -> int:
    parser = argparse.ArgumentParser(description="Run backend smoke tests against FastAPI.")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000/api/v1",
        help="Base API URL. Default: http://127.0.0.1:8000/api/v1",
    )
    args = parser.parse_args()
    client = ApiClient(args.base_url.rstrip("/"))

    email = f"smoke_{uuid4().hex[:10]}@test.com"
    password = "testtest123"

    health = client.get("/health")
    assert_success("health", health)
    assert health["data"]["status"] == "ok"
    passed("health")

    signup = client.post(
        "/auth/signup",
        {"email": email, "password": password, "name": "Smoke Test"},
        expected_status=201,
    )
    assert_success("signup", signup)
    passed("signup")

    login = client.post("/auth/login", {"email": email, "password": password})
    assert_success("login", login)
    access_token = login["data"]["access_token"]
    refresh_token = login["data"]["refresh_token"]
    passed("login")

    refreshed = client.post("/auth/refresh", {"refresh_token": refresh_token})
    assert_success("refresh", refreshed)
    access_token = refreshed["data"]["access_token"]
    passed("refresh")

    me = client.get("/auth/me", token=access_token)
    assert_success("me", me)
    assert me["data"]["user"]["email"] == email
    passed("me")

    products = client.get("/products?size=5")
    assert_success("products", products)
    product_count = len(products["data"]["items"])
    print(f"PRODUCT_COUNT={product_count}")
    passed("products")

    foot_profile = client.put(
        "/profiles/foot",
        {
            "foot_length_mm": 255.5,
            "foot_width_mm": 98.2,
            "confidence": 0.91,
        },
        token=access_token,
    )
    assert_success("foot_profile", foot_profile)
    passed("foot_profile")

    recommendations = client.get("/recommendations?limit=5", token=access_token)
    assert_success("recommendations", recommendations)
    recommendation_count = len(recommendations["data"]["items"])
    print(f"RECOMMENDATION_COUNT={recommendation_count}")
    passed("recommendations")

    consent = client.post(
        "/consents",
        {
            "measurement_data": True,
            "image_storage": True,
            "policy_version": "v1",
        },
        token=access_token,
        expected_status=201,
    )
    assert_success("consent", consent)
    passed("consent")

    session = client.post(
        "/measurements/sessions",
        {"consent_id": consent["data"]["id"]},
        token=access_token,
        expected_status=201,
    )
    assert_success("measurement_session", session)
    session_id = session["data"]["session_id"]
    passed("measurement_session")

    pre_validate_analysis = client.post(
        f"/measurements/sessions/{session_id}/analyze",
        {"point_x": 320, "point_y": 240},
        token=access_token,
        expected_status=409,
    )
    assert_error("pre_validate_analysis", pre_validate_analysis)
    passed("pre_validate_analysis")

    image_path = create_test_image()
    try:
        image_upload = client.multipart_post(
            f"/measurements/sessions/{session_id}/image",
            fields={
                "client_width": "640",
                "client_height": "480",
                "device_orientation": "portrait",
            },
            file_field="image",
            file_path=image_path,
            content_type="image/jpeg",
            token=access_token,
        )
    finally:
        image_path.unlink(missing_ok=True)

    assert_success("image_upload", image_upload)
    passed("image_upload")

    image_validation = client.post(
        f"/measurements/sessions/{session_id}/validate",
        {},
        token=access_token,
    )
    assert_success("image_validation", image_validation)
    assert image_validation["data"]["next_status"] == "SEGMENTING"
    passed("image_validation")

    analysis = client.post(
        f"/measurements/sessions/{session_id}/analyze",
        {"point_x": 320, "point_y": 240},
        token=access_token,
        expected_status=501,
    )
    assert_error("analysis_not_implemented", analysis)
    passed("analysis_not_implemented")

    measurement_result = client.post(
        f"/measurements/sessions/{session_id}/result",
        {
            "foot_length_mm": 256.4,
            "foot_width_mm": 99.1,
            "segmentation_confidence": 0.934,
        },
        token=access_token,
    )
    assert_success("measurement_result", measurement_result)
    assert measurement_result["data"]["status"] == "COMPLETED"
    passed("measurement_result")

    result_read = client.get(f"/measurements/sessions/{session_id}/result", token=access_token)
    assert_success("measurement_result_read", result_read)
    assert result_read["data"]["result_id"] == measurement_result["data"]["result_id"]
    passed("measurement_result_read")

    print("SMOKE_TEST=PASS")
    return 0


class ApiClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    def get(self, path: str, *, token: str | None = None, expected_status: int = 200):
        return self.request("GET", path, token=token, expected_status=expected_status)

    def post(
        self,
        path: str,
        payload: dict,
        *,
        token: str | None = None,
        expected_status: int = 200,
    ):
        return self.request(
            "POST",
            path,
            payload=payload,
            token=token,
            expected_status=expected_status,
        )

    def put(
        self,
        path: str,
        payload: dict,
        *,
        token: str | None = None,
        expected_status: int = 200,
    ):
        return self.request(
            "PUT",
            path,
            payload=payload,
            token=token,
            expected_status=expected_status,
        )

    def request(
        self,
        method: str,
        path: str,
        *,
        payload: dict | None = None,
        token: str | None = None,
        expected_status: int = 200,
    ):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            method=method,
            headers={"Accept": "application/json"},
        )
        if payload is not None:
            request.add_header("Content-Type", "application/json")
        if token is not None:
            request.add_header("Authorization", f"Bearer {token}")

        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                body = json.loads(response.read().decode("utf-8"))
                if response.status != expected_status:
                    raise AssertionError(
                        f"{method} {path}: expected {expected_status}, got {response.status}"
                    )
                return body
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            if exc.code == expected_status:
                return json.loads(body)
            raise AssertionError(
                f"{method} {path}: expected {expected_status}, got {exc.code}. {body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise AssertionError(
                f"Cannot reach API server at {self.base_url}. Start FastAPI first."
            ) from exc

    def multipart_post(
        self,
        path: str,
        *,
        fields: dict[str, str],
        file_field: str,
        file_path: Path,
        content_type: str,
        token: str | None = None,
        expected_status: int = 200,
    ):
        boundary = f"----shoefit-smoke-{uuid4().hex}"
        body = bytearray()
        for name, value in fields.items():
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{value}\r\n".encode("utf-8"))

        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            (
                f'Content-Disposition: form-data; name="{file_field}"; '
                f'filename="{file_path.name}"\r\n'
            ).encode("utf-8")
        )
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(file_path.read_bytes())
        body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=bytes(body),
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
        )
        if token is not None:
            request.add_header("Authorization", f"Bearer {token}")

        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if response.status != expected_status:
                    raise AssertionError(
                        f"POST {path}: expected {expected_status}, got {response.status}"
                    )
                return payload
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            if exc.code == expected_status:
                return json.loads(body)
            raise AssertionError(
                f"POST {path}: expected {expected_status}, got {exc.code}. {body}"
            ) from exc


def assert_success(name: str, response: dict) -> None:
    if response.get("success") is not True:
        raise AssertionError(f"{name}: success is not true: {response}")


def assert_error(name: str, response: dict) -> None:
    if response.get("success") is not False:
        raise AssertionError(f"{name}: success is not false: {response}")


def create_test_image() -> Path:
    image = np.full((480, 640, 3), 180, dtype=np.uint8)
    for x in range(0, 640, 20):
        cv2.line(image, (x, 0), (x, 479), (30, 30, 30), 2)
    for y in range(0, 480, 20):
        cv2.line(image, (0, y), (639, y), (30, 30, 30), 2)

    path = Path(tempfile.gettempdir()) / f"shoefit-smoke-{uuid4().hex}.jpg"
    if not cv2.imwrite(str(path), image):
        raise AssertionError("Failed to create smoke test image.")
    return path


def passed(name: str) -> None:
    print(f"{name.upper()}=PASS")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"SMOKE_TEST=FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
