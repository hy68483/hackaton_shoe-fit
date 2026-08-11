from datetime import date

from pydantic import BaseModel, Field


class BrandRead(BaseModel):
    id: str
    name: str


class ProductListItem(BaseModel):
    id: str
    brand: BrandRead
    name: str
    model_code: str
    data_status: str


class ProductRead(ProductListItem):
    pass


class ProductSizeRead(BaseModel):
    id: str
    size: str
    length_mm: float
    width_mm: float
    material: str | None = None
    fit_type: str | None = None
    source: str | None = None
    measured_at: date | None = None


class ProductSearchParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    brand_id: str | None = None
    keyword: str | None = Field(default=None, max_length=100)
