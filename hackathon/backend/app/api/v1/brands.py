from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.services import BrandService

router = APIRouter()


def get_brand_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BrandService:
    return BrandService(session)


@router.get("")
async def list_brands(
    brand_service: Annotated[BrandService, Depends(get_brand_service)],
) -> dict[str, object]:
    brands = await brand_service.list_brands()
    return {
        "success": True,
        "data": {
            "items": [brand.model_dump() for brand in brands],
        },
    }


@router.get("/{brand_id}")
async def get_brand(
    brand_id: UUID,
    brand_service: Annotated[BrandService, Depends(get_brand_service)],
) -> dict[str, object]:
    brand = await brand_service.get_brand(brand_id)
    return {
        "success": True,
        "data": brand.model_dump(),
    }
