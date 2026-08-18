from math import ceil
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import Brand, Product, ProductSize
from app.repositories import BrandRepository, ProductRepository
from app.schemas.products import (
    BrandRead,
    ProductListItem,
    ProductRead,
    ProductSearchParams,
    ProductSizeRead,
)


class BrandService:
    def __init__(self, session: AsyncSession) -> None:
        self.brand_repository = BrandRepository(session)

    async def list_brands(self) -> list[BrandRead]:
        brands = await self.brand_repository.list()
        return [self._to_brand_read(brand) for brand in brands]

    async def get_brand(self, brand_id: UUID) -> BrandRead:
        brand = await self.brand_repository.get_by_id(brand_id)
        if brand is None:
            raise api_error(404, "NOT_FOUND", "Brand not found.")
        return self._to_brand_read(brand)

    def _to_brand_read(self, brand: Brand) -> BrandRead:
        return BrandRead(id=str(brand.id), name=brand.name)


class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.product_repository = ProductRepository(session)

    async def list_products(
        self,
        params: ProductSearchParams,
    ) -> tuple[list[ProductListItem], dict[str, int]]:
        brand_id = self._parse_uuid(params.brand_id, field="brand_id")
        products, total = await self.product_repository.list(
            page=params.page,
            size=params.size,
            brand_id=brand_id,
            keyword=params.keyword,
        )
        total_pages = ceil(total / params.size) if total else 0
        return (
            [self._to_product_list_item(product) for product in products],
            {
                "page": params.page,
                "size": params.size,
                "total": total,
                "total_pages": total_pages,
            },
        )

    async def get_product(self, product_id: UUID) -> ProductRead:
        product = await self.product_repository.get_by_id(product_id)
        if product is None:
            raise api_error(404, "NOT_FOUND", "Product not found.")
        return ProductRead(**self._to_product_list_item(product).model_dump())

    async def list_product_sizes(self, product_id: UUID) -> list[ProductSizeRead]:
        product = await self.product_repository.get_by_id(product_id)
        if product is None:
            raise api_error(404, "NOT_FOUND", "Product not found.")

        sizes = await self.product_repository.list_sizes(product_id)
        return [self._to_product_size_read(product_size) for product_size in sizes]

    def _parse_uuid(self, value: str | None, *, field: str) -> UUID | None:
        if value is None:
            return None
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

    def _to_product_list_item(self, product: Product) -> ProductListItem:
        return ProductListItem(
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
