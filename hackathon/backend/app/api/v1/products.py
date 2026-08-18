from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.schemas.products import ProductSearchParams
from app.services import ProductService

router = APIRouter()


def get_product_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProductService:
    return ProductService(session)


@router.get("")
async def list_products(
    product_service: Annotated[ProductService, Depends(get_product_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    brand_id: str | None = None,
    keyword: Annotated[str | None, Query(max_length=100)] = None,
) -> dict[str, object]:
    products, meta = await product_service.list_products(
        ProductSearchParams(
            page=page,
            size=size,
            brand_id=brand_id,
            keyword=keyword,
        )
    )
    return {
        "success": True,
        "data": {
            "items": [product.model_dump() for product in products],
        },
        "meta": meta,
    }


@router.get("/{product_id}")
async def get_product(
    product_id: UUID,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> dict[str, object]:
    product = await product_service.get_product(product_id)
    return {
        "success": True,
        "data": product.model_dump(),
    }


@router.get("/{product_id}/sizes")
async def list_product_sizes(
    product_id: UUID,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> dict[str, object]:
    product_sizes = await product_service.list_product_sizes(product_id)
    return {
        "success": True,
        "data": {
            "items": [product_size.model_dump() for product_size in product_sizes],
        },
    }
