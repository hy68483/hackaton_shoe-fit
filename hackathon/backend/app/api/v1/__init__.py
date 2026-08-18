from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    brands,
    consents,
    measurements,
    products,
    profiles,
    recommendations,
)

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
async def health_check() -> dict[str, object]:
    return {
        "success": True,
        "data": {
            "status": "ok",
        },
    }


api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])
api_router.include_router(consents.router, prefix="/consents", tags=["consents"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(measurements.router, prefix="/measurements", tags=["measurements"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
