from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Brand, Product, ProductSize


class BrandRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self) -> list[Brand]:
        result = await self.session.execute(select(Brand).order_by(Brand.name.asc()))
        return list(result.scalars().all())

    async def get_by_id(self, brand_id: UUID) -> Brand | None:
        result = await self.session.execute(select(Brand).where(Brand.id == brand_id))
        return result.scalar_one_or_none()

    async def create(self, *, name: str) -> Brand:
        brand = Brand(name=name)
        self.session.add(brand)
        await self.session.commit()
        await self.session.refresh(brand)
        return brand


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(
        self,
        *,
        page: int,
        size: int,
        brand_id: UUID | None = None,
        keyword: str | None = None,
    ) -> tuple[list[Product], int]:
        statement = self._base_search_statement(brand_id=brand_id, keyword=keyword)
        count_statement = select(func.count()).select_from(statement.subquery())

        total_result = await self.session.execute(count_statement)
        total = int(total_result.scalar_one())

        result = await self.session.execute(
            statement.options(selectinload(Product.brand))
            .order_by(Product.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return list(result.scalars().all()), total

    async def get_by_id(self, product_id: UUID) -> Product | None:
        result = await self.session.execute(
            select(Product)
            .options(selectinload(Product.brand))
            .where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        brand_id: UUID,
        name: str,
        model_code: str,
        data_status: str,
    ) -> Product:
        product = Product(
            brand_id=brand_id,
            name=name,
            model_code=model_code,
            data_status=data_status,
        )
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product, attribute_names=["brand"])
        return product

    async def list_sizes(self, product_id: UUID) -> list[ProductSize]:
        result = await self.session.execute(
            select(ProductSize)
            .where(ProductSize.product_id == product_id)
            .order_by(ProductSize.size.asc())
        )
        return list(result.scalars().all())

    async def create_size(
        self,
        *,
        product_id: UUID,
        size: str,
        length_mm: Decimal,
        width_mm: Decimal,
        material: str | None,
        fit_type: str | None,
        source: str | None,
        measured_at: date | None,
    ) -> ProductSize:
        product_size = ProductSize(
            product_id=product_id,
            size=size,
            length_mm=length_mm,
            width_mm=width_mm,
            material=material,
            fit_type=fit_type,
            source=source,
            measured_at=measured_at,
        )
        self.session.add(product_size)
        await self.session.commit()
        await self.session.refresh(product_size)
        return product_size

    async def list_recommendation_candidates(
        self,
        *,
        product_id: UUID | None = None,
        brand_id: UUID | None = None,
    ) -> list[ProductSize]:
        statement = (
            select(ProductSize)
            .join(Product)
            .options(selectinload(ProductSize.product).selectinload(Product.brand))
            .where(Product.data_status == "AVAILABLE")
        )
        if product_id is not None:
            statement = statement.where(ProductSize.product_id == product_id)
        if brand_id is not None:
            statement = statement.where(Product.brand_id == brand_id)

        result = await self.session.execute(
            statement.order_by(Product.name.asc(), ProductSize.size.asc())
        )
        return list(result.scalars().all())

    def _base_search_statement(
        self,
        *,
        brand_id: UUID | None,
        keyword: str | None,
    ) -> Select[tuple[Product]]:
        statement = select(Product)
        if brand_id is not None:
            statement = statement.where(Product.brand_id == brand_id)

        normalized_keyword = keyword.strip() if keyword else None
        if normalized_keyword:
            like_keyword = f"%{normalized_keyword}%"
            statement = statement.where(
                or_(
                    Product.name.ilike(like_keyword),
                    Product.model_code.ilike(like_keyword),
                )
            )
        return statement
