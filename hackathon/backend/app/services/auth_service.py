from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import api_error
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import User
from app.repositories import UserRepository
from app.schemas.auth import (
    LoginResponse,
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserLogin,
    UserRead,
)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.user_repository = UserRepository(session)

    async def signup(self, payload: UserCreate) -> tuple[UserRead, TokenPair]:
        existing_user = await self.user_repository.get_by_login_id(payload.login_id)
        if existing_user is not None:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Login ID is already in use.",
                field="login_id",
            )
        if payload.email is not None:
            existing_email_user = await self.user_repository.get_by_email(payload.email)
            if existing_email_user is not None:
                raise api_error(
                    409,
                    "BUSINESS_RULE_VIOLATION",
                    "Email is already in use.",
                    field="email",
                )

        user = await self.user_repository.create(
            login_id=payload.login_id,
            email=payload.email,
            password_hash=hash_password(payload.password),
            name=payload.name,
        )
        return self._to_user_read(user), self._create_token_pair(user)

    async def login(self, payload: UserLogin) -> LoginResponse:
        if "@" in payload.login_id:
            user = await self.user_repository.get_by_email(payload.login_id)
        else:
            user = await self.user_repository.get_by_login_id(payload.login_id)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise api_error(
                401,
                "UNAUTHORIZED",
                "Login ID, email, or password is incorrect.",
            )

        token_pair = self._create_token_pair(user)
        return LoginResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        )

    async def refresh(self, payload: RefreshTokenRequest) -> LoginResponse:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise api_error(401, "UNAUTHORIZED", "Refresh token is required.")

        subject = token_payload.get("sub")
        try:
            user_id = UUID(str(subject))
        except ValueError as exc:
            raise api_error(401, "UNAUTHORIZED", "Invalid token subject.") from exc

        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise api_error(401, "UNAUTHORIZED", "User not found.")

        token_pair = self._create_token_pair(user)
        return LoginResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        )

    async def get_current_user(self, access_token: str) -> UserRead:
        payload = decode_token(access_token)
        if payload.get("type") != "access":
            raise api_error(401, "UNAUTHORIZED", "Access token is required.")

        subject = payload.get("sub")
        try:
            user_id = UUID(str(subject))
        except ValueError as exc:
            raise api_error(401, "UNAUTHORIZED", "Invalid token subject.") from exc

        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise api_error(401, "UNAUTHORIZED", "User not found.")
        return self._to_user_read(user)

    async def check_email(self, email: str) -> dict[str, bool]:
        normalized_email = email.strip().lower()
        user = await self.user_repository.get_by_email(normalized_email)
        return {"available": user is None}

    def _create_token_pair(self, user: User) -> TokenPair:
        subject = str(user.id)
        return TokenPair(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    def _to_user_read(self, user: User) -> UserRead:
        return UserRead(
            id=str(user.id),
            login_id=user.login_id,
            name=user.name,
            email=user.email,
            role=user.role,
        )
