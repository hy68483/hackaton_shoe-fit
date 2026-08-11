from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.consents import ConsentCreate
from app.services import AuthService, ConsentService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_consent_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ConsentService:
    return ConsentService(session)


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


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_consent(
    payload: ConsentCreate,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
) -> dict[str, object]:
    consent = await consent_service.create_consent(user_id, payload)
    return {
        "success": True,
        "data": consent.model_dump(),
    }


@router.get("/me")
async def get_my_consent(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
) -> dict[str, object]:
    consent = await consent_service.get_my_consent(user_id)
    return {
        "success": True,
        "data": consent.model_dump() if consent is not None else None,
    }


@router.delete("")
async def revoke_my_consent(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
) -> dict[str, object]:
    revoked = await consent_service.revoke_my_consent(user_id)
    return {
        "success": True,
        "data": {
            "revoked": revoked,
        },
    }
