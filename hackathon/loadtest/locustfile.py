import os

from locust import HttpUser, between, task
from locust.exception import StopUser


API_PREFIX = "/api/v1"


class ShoeFitApiUser(HttpUser):
    wait_time = between(0.5, 1.5)

    def on_start(self) -> None:
        self.access_token: str | None = None
        login_id = os.getenv("LOAD_TEST_LOGIN_ID")
        password = os.getenv("LOAD_TEST_PASSWORD")
        if not login_id or not password:
            return

        with self.client.post(
            f"{API_PREFIX}/auth/login",
            json={"login_id": login_id, "password": password},
            name="POST /auth/login",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"login failed: {response.status_code}")
                raise StopUser()

            try:
                self.access_token = response.json()["data"]["access_token"]
            except (KeyError, TypeError, ValueError):
                response.failure("login response has no access token")
                raise StopUser()

    @task(1)
    def health(self) -> None:
        self.client.get(f"{API_PREFIX}/health", name="GET /health")

    @task(4)
    def products(self) -> None:
        self.client.get(f"{API_PREFIX}/products", name="GET /products")

    @task(2)
    def brands(self) -> None:
        self.client.get(f"{API_PREFIX}/brands", name="GET /brands")

    @task(3)
    def me(self) -> None:
        if not self.access_token:
            self.products()
            return

        self.client.get(
            f"{API_PREFIX}/auth/me",
            headers={"Authorization": f"Bearer {self.access_token}"},
            name="GET /auth/me",
        )
