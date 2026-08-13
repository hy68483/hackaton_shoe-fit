import argparse
import json
import sys
import urllib.error
import urllib.request
from uuid import uuid4


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
            raise AssertionError(
                f"{method} {path}: expected {expected_status}, got {exc.code}. {body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise AssertionError(
                f"Cannot reach API server at {self.base_url}. Start FastAPI first."
            ) from exc


def assert_success(name: str, response: dict) -> None:
    if response.get("success") is not True:
        raise AssertionError(f"{name}: success is not true: {response}")


def passed(name: str) -> None:
    print(f"{name.upper()}=PASS")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"SMOKE_TEST=FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
