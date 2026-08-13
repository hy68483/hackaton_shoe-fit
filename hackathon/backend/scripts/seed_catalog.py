import asyncio
import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import AsyncSessionLocal, create_database_tables  # noqa: E402
from app.models import Brand, Product, ProductSize  # noqa: E402


SEED_CATALOG = [
    {
        "brand": "Nike",
        "products": [
            {
                "name": "Air Runner",
                "model_code": "NIKE-AIR-RUNNER",
                "sizes": [
                    {"size": "250", "length_mm": "255.00", "width_mm": "98.00"},
                    {"size": "260", "length_mm": "265.00", "width_mm": "103.00"},
                    {"size": "270", "length_mm": "275.00", "width_mm": "108.00"},
                ],
            }
        ],
    },
    {
        "brand": "Adidas",
        "products": [
            {
                "name": "Daily Walk",
                "model_code": "ADIDAS-DAILY-WALK",
                "sizes": [
                    {"size": "250", "length_mm": "256.00", "width_mm": "99.00"},
                    {"size": "260", "length_mm": "266.00", "width_mm": "104.00"},
                    {"size": "270", "length_mm": "276.00", "width_mm": "109.00"},
                ],
            }
        ],
    },
]


async def main() -> None:
    await create_database_tables()
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured.")

    async with AsyncSessionLocal() as session:
        brand_count = 0
        product_count = 0
        size_count = 0

        for brand_data in SEED_CATALOG:
            brand, brand_created = await get_or_create_brand(session, brand_data["brand"])
            brand_count += int(brand_created)

            for product_data in brand_data["products"]:
                product, product_created = await get_or_create_product(
                    session,
                    brand=brand,
                    name=product_data["name"],
                    model_code=product_data["model_code"],
                )
                product_count += int(product_created)

                for size_data in product_data["sizes"]:
                    _, size_created = await get_or_create_product_size(
                        session,
                        product=product,
                        size=size_data["size"],
                        length_mm=Decimal(size_data["length_mm"]),
                        width_mm=Decimal(size_data["width_mm"]),
                    )
                    size_count += int(size_created)

        await session.commit()

    print(
        "Seed complete: "
        f"brands_created={brand_count}, "
        f"products_created={product_count}, "
        f"sizes_created={size_count}"
    )


async def get_or_create_brand(session, name: str) -> tuple[Brand, bool]:
    result = await session.execute(select(Brand).where(Brand.name == name))
    brand = result.scalar_one_or_none()
    if brand is not None:
        return brand, False

    brand = Brand(name=name)
    session.add(brand)
    await session.flush()
    return brand, True


async def get_or_create_product(
    session,
    *,
    brand: Brand,
    name: str,
    model_code: str,
) -> tuple[Product, bool]:
    result = await session.execute(
        select(Product).where(
            Product.brand_id == brand.id,
            Product.model_code == model_code,
        )
    )
    product = result.scalar_one_or_none()
    if product is not None:
        return product, False

    product = Product(
        brand_id=brand.id,
        name=name,
        model_code=model_code,
        data_status="AVAILABLE",
    )
    session.add(product)
    await session.flush()
    return product, True


async def get_or_create_product_size(
    session,
    *,
    product: Product,
    size: str,
    length_mm: Decimal,
    width_mm: Decimal,
) -> tuple[ProductSize, bool]:
    result = await session.execute(
        select(ProductSize).where(
            ProductSize.product_id == product.id,
            ProductSize.size == size,
        )
    )
    product_size = result.scalar_one_or_none()
    if product_size is not None:
        return product_size, False

    product_size = ProductSize(
        product_id=product.id,
        size=size,
        length_mm=length_mm,
        width_mm=width_mm,
        material="mesh",
        fit_type="regular",
        source="seed",
    )
    session.add(product_size)
    await session.flush()
    return product_size, True


if __name__ == "__main__":
    asyncio.run(main())
