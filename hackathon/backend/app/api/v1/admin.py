from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.admin import BrandCreate, ProductCreate, ProductSizeCreate
from app.services import AdminCatalogService, AuthService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_admin_catalog_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AdminCatalogService:
    return AdminCatalogService(session)


def get_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if credentials is None:
        raise api_error(401, "UNAUTHORIZED", "Authentication token is required.")

    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise api_error(401, "UNAUTHORIZED", "Invalid bearer token format.")
    return credentials.credentials


async def require_admin(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    user = await auth_service.get_current_user(token)
    if user.role != "ADMIN":
        raise api_error(403, "FORBIDDEN", "Admin permission is required.")


@router.post("/brands", status_code=status.HTTP_201_CREATED)
async def create_brand(
    payload: BrandCreate,
    _: Annotated[None, Depends(require_admin)],
    admin_catalog_service: Annotated[
        AdminCatalogService,
        Depends(get_admin_catalog_service),
    ],
) -> dict[str, object]:
    brand = await admin_catalog_service.create_brand(payload)
    return {
        "success": True,
        "data": brand.model_dump(),
    }


@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    _: Annotated[None, Depends(require_admin)],
    admin_catalog_service: Annotated[
        AdminCatalogService,
        Depends(get_admin_catalog_service),
    ],
) -> dict[str, object]:
    product = await admin_catalog_service.create_product(payload)
    return {
        "success": True,
        "data": product.model_dump(),
    }


@router.post("/products/{product_id}/sizes", status_code=status.HTTP_201_CREATED)
async def create_product_size(
    product_id: UUID,
    payload: ProductSizeCreate,
    _: Annotated[None, Depends(require_admin)],
    admin_catalog_service: Annotated[
        AdminCatalogService,
        Depends(get_admin_catalog_service),
    ],
) -> dict[str, object]:
    product_size = await admin_catalog_service.create_product_size(
        product_id=product_id,
        payload=payload,
    )
    return {
        "success": True,
        "data": product_size.model_dump(),
    }
