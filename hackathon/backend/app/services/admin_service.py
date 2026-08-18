from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import Brand, Product, ProductSize
from app.repositories import BrandRepository, ProductRepository
from app.schemas.admin import BrandCreate, ProductCreate, ProductSizeCreate
from app.schemas.products import BrandRead, ProductRead, ProductSizeRead


class AdminCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self.brand_repository = BrandRepository(session)
        self.product_repository = ProductRepository(session)

    async def create_brand(self, payload: BrandCreate) -> BrandRead:
        try:
            brand = await self.brand_repository.create(name=payload.name.strip())
        except IntegrityError as exc:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Brand already exists.",
                field="name",
            ) from exc
        return self._to_brand_read(brand)

    async def create_product(self, payload: ProductCreate) -> ProductRead:
        brand_id = self._parse_uuid(payload.brand_id, field="brand_id")
        brand = await self.brand_repository.get_by_id(brand_id)
        if brand is None:
            raise api_error(404, "NOT_FOUND", "Brand not found.", field="brand_id")

        try:
            product = await self.product_repository.create(
                brand_id=brand_id,
                name=payload.name.strip(),
                model_code=payload.model_code.strip(),
                data_status=payload.data_status.strip(),
            )
        except IntegrityError as exc:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Product model code already exists for this brand.",
                field="model_code",
            ) from exc
        return self._to_product_read(product)

    async def create_product_size(
        self,
        *,
        product_id: UUID,
        payload: ProductSizeCreate,
    ) -> ProductSizeRead:
        product = await self.product_repository.get_by_id(product_id)
        if product is None:
            raise api_error(404, "NOT_FOUND", "Product not found.")

        try:
            product_size = await self.product_repository.create_size(
                product_id=product_id,
                size=payload.size.strip(),
                length_mm=Decimal(str(payload.length_mm)),
                width_mm=Decimal(str(payload.width_mm)),
                material=payload.material.strip() if payload.material else None,
                fit_type=payload.fit_type.strip() if payload.fit_type else None,
                source=payload.source.strip() if payload.source else None,
                measured_at=payload.measured_at,
            )
        except IntegrityError as exc:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Product size already exists for this product.",
                field="size",
            ) from exc
        return self._to_product_size_read(product_size)

    def _parse_uuid(self, value: str, *, field: str) -> UUID:
        try:
            return UUID(value)
        except ValueError as exc:
            raise api_error(
                422,
                "VALIDATION_ERROR",
                f"Invalid {field} format.",
                field=field,
            ) from exc

    def _to_brand_read(self, brand: Brand) -> BrandRead:
        return BrandRead(id=str(brand.id), name=brand.name)

    def _to_product_read(self, product: Product) -> ProductRead:
        return ProductRead(
            id=str(product.id),
            brand=self._to_brand_read(product.brand),
            name=product.name,
            model_code=product.model_code,
            data_status=product.data_status,
        )

    def _to_product_size_read(self, product_size: ProductSize) -> ProductSizeRead:
        return ProductSizeRead(
            id=str(product_size.id),
            size=product_size.size,
            length_mm=float(product_size.length_mm),
            width_mm=float(product_size.width_mm),
            material=product_size.material,
            fit_type=product_size.fit_type,
            source=product_size.source,
            measured_at=product_size.measured_at,
        )
