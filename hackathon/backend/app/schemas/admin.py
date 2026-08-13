from datetime import date

from pydantic import BaseModel, Field


class BrandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ProductCreate(BaseModel):
    brand_id: str
    name: str = Field(min_length=1, max_length=150)
    model_code: str = Field(min_length=1, max_length=100)
    data_status: str = Field(default="AVAILABLE", min_length=1, max_length=20)


class ProductSizeCreate(BaseModel):
    size: str = Field(min_length=1, max_length=20)
    length_mm: float = Field(gt=0, le=400)
    width_mm: float = Field(gt=0, le=200)
    material: str | None = Field(default=None, max_length=50)
    fit_type: str | None = Field(default=None, max_length=30)
    source: str | None = Field(default=None, max_length=30)
    measured_at: date | None = None
