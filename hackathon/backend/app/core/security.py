import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt

from app.core.config import settings
from app.core.exceptions import api_error


def get_access_token_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)


def get_refresh_token_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(subject: str) -> str:
    return _create_token(
        subject=subject,
        token_type="access",
        expires_at=get_access_token_expires_at(),
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject=subject,
        token_type="refresh",
        expires_at=get_refresh_token_expires_at(),
    )


def decode_token(token: str) -> dict[str, Any]:
    if not settings.jwt_secret:
        raise api_error(500, "INTERNAL_ERROR", "JWT_SECRET is not configured.")

    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise api_error(401, "UNAUTHORIZED", "토큰이 올바르지 않습니다.") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    expected_signature = _sign(signing_input)

    if not hmac.compare_digest(signature_segment, expected_signature):
        raise api_error(401, "UNAUTHORIZED", "토큰이 올바르지 않습니다.")

    try:
        payload = json.loads(_base64url_decode(payload_segment))
    except (ValueError, json.JSONDecodeError) as exc:
        raise api_error(401, "UNAUTHORIZED", "토큰이 올바르지 않습니다.") from exc

    exp = payload.get("exp")
    if not isinstance(exp, int) or datetime.now(UTC).timestamp() > exp:
        raise api_error(401, "UNAUTHORIZED", "토큰이 만료되었습니다.")

    return payload


def _create_token(subject: str, token_type: str, expires_at: datetime) -> str:
    if settings.jwt_algorithm != "HS256":
        raise api_error(500, "INTERNAL_ERROR", "Only HS256 JWT is supported.")
    if not settings.jwt_secret:
        raise api_error(500, "INTERNAL_ERROR", "JWT_SECRET is not configured.")

    header = {
        "alg": settings.jwt_algorithm,
        "typ": "JWT",
    }
    payload = {
        "sub": subject,
        "type": token_type,
        "exp": int(expires_at.timestamp()),
        "iat": int(datetime.now(UTC).timestamp()),
    }
    header_segment = _base64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_segment = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature_segment = _sign(signing_input)
    return f"{header_segment}.{payload_segment}.{signature_segment}"


def _sign(data: bytes) -> str:
    digest = hmac.new(settings.jwt_secret.encode("utf-8"), data, hashlib.sha256).digest()
    return _base64url_encode(digest)


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)
