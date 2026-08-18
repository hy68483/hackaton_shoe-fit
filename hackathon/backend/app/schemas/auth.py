from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class UserCreate(BaseModel):
    login_id: str = Field(min_length=4, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)

    @model_validator(mode="before")
    @classmethod
    def split_email_identifier(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        login_id = data.get("login_id")
        email = data.get("email")
        if isinstance(login_id, str) and "@" in login_id and not email:
            normalized_email = login_id.strip().lower()
            normalized_login_id = normalized_email.split("@", 1)[0]
            return {**data, "login_id": normalized_login_id, "email": normalized_email}
        return data

    @field_validator("login_id")
    @classmethod
    def normalize_login_id(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Login ID can contain only letters, numbers, hyphen, and underscore.")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Invalid email format.")
        return normalized


class UserLogin(BaseModel):
    login_id: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("login_id")
    @classmethod
    def normalize_login_id(cls, value: str) -> str:
        return value.strip().lower()


class UserRead(BaseModel):
    id: str
    login_id: str
    name: str
    email: str | None = None
    role: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str


class LoginResponse(TokenPair):
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1)
