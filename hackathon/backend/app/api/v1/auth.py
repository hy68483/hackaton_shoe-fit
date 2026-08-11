from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.auth import UserCreate, UserLogin
from app.services import AuthService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if credentials is None:
        raise api_error(401, "UNAUTHORIZED", "인증 토큰이 필요합니다.")

    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise api_error(401, "UNAUTHORIZED", "Bearer 토큰 형식이 아닙니다.")
    return credentials.credentials


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    payload: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    user, tokens = await auth_service.signup(payload)
    return {
        "success": True,
        "data": {
            "user": user.model_dump(),
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
        },
    }


@router.post("/login")
async def login(
    payload: UserLogin,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    result = await auth_service.login(payload)
    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.get("/me")
async def me(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    user = await auth_service.get_current_user(token)
    return {
        "success": True,
        "data": {
            "user": user.model_dump(),
        },
    }


@router.get("/check-email")
async def check_email(
    email: Annotated[str, Query(min_length=3, max_length=255)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, object]:
    result = await auth_service.check_email(email)
    return {
        "success": True,
        "data": result,
    }
