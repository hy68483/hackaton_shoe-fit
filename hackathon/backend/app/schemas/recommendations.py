from pydantic import BaseModel, Field

from app.schemas.products import BrandRead


class RecommendationSearchParams(BaseModel):
    product_id: str | None = None
    brand_id: str | None = None
    limit: int = Field(default=10, ge=1, le=50)


class RecommendedSizeRead(BaseModel):
    product_id: str
    product_name: str
    brand: BrandRead
    product_size_id: str
    size: str
    length_mm: float
    width_mm: float
    fit_score: float
    length_diff_mm: float
    width_diff_mm: float
    fit_note: str


class RecommendationRead(BaseModel):
    foot_length_mm: float
    foot_width_mm: float
    items: list[RecommendedSizeRead]
