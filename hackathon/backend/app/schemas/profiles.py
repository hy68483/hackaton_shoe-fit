from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class FootProfileApply(BaseModel):
    measurement_id: UUID | None = None
    foot_length_mm: float = Field(gt=0, le=400)
    foot_width_mm: float = Field(gt=0, le=200)
    confidence: float | None = Field(default=None, ge=0, le=1)
    measured_at: datetime | None = None

    @field_validator("foot_length_mm", "foot_width_mm", "confidence")
    @classmethod
    def round_measurement(cls, value: float | None) -> float | None:
        if value is None:
            return value
        return round(value, 3)


class FootProfileRead(BaseModel):
    foot_length_mm: float
    foot_width_mm: float
    confidence: float | None = None
    measurement_id: str | None = None
    measured_at: datetime | None = None
