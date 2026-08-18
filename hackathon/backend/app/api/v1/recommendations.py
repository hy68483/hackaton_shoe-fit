from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.recommendations import RecommendationSearchParams
from app.services import AuthService, RecommendationService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_recommendation_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RecommendationService:
    return RecommendationService(session)


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


@router.get("")
async def recommend_sizes(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    recommendation_service: Annotated[
        RecommendationService,
        Depends(get_recommendation_service),
    ],
    product_id: str | None = None,
    brand_id: str | None = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> dict[str, object]:
    recommendations = await recommendation_service.recommend(
        user_id=user_id,
        params=RecommendationSearchParams(
            product_id=product_id,
            brand_id=brand_id,
            limit=limit,
        ),
    )
    return {
        "success": True,
        "data": recommendations.model_dump(),
    }
