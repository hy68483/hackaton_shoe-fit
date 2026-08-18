from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.profiles import FootProfileApply
from app.services import AuthService, ProfileService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_profile_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProfileService:
    return ProfileService(session)


def get_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if credentials is None:
        raise api_error(401, "UNAUTHORIZED", "Authentication token is required.")

    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise api_error(401, "UNAUTHORIZED", "Invalid bearer token format.")
    return credentials.credentials


async def get_current_user_id(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UUID:
    user = await auth_service.get_current_user(token)
    return UUID(user.id)


@router.get("/foot")
async def get_foot_profile(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    foot_profile = await profile_service.get_foot_profile(user_id)
    return {
        "success": True,
        "data": foot_profile.model_dump() if foot_profile is not None else None,
    }


@router.put("/foot")
async def apply_foot_profile(
    payload: FootProfileApply,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    foot_profile = await profile_service.apply_foot_profile(user_id, payload)
    return {
        "success": True,
        "data": foot_profile.model_dump(),
    }


@router.delete("/foot", status_code=status.HTTP_200_OK)
async def delete_foot_profile(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    deleted = await profile_service.delete_foot_profile(user_id)
    return {
        "success": True,
        "data": {
            "deleted": deleted,
        },
    }
