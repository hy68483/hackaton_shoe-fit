from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MeasurementSessionCreate(BaseModel):
    consent_id: UUID


class MeasurementSessionRead(BaseModel):
    session_id: str
    consent_id: str
    status: str
    confidence: float | None = None
    created_at: datetime
    updated_at: datetime


class MeasurementImageRead(BaseModel):
    image_id: str
    session_id: str
    original_key: str
    content_type: str
    file_size_bytes: int
    client_width: int
    client_height: int
    device_orientation: str
    status: str


class ImageQualityChecks(BaseModel):
    measurement_sheet: bool
    foot_complete: bool
    blur: bool
    brightness: bool
    marker: bool
    perspective: bool


class ImageValidationRead(BaseModel):
    valid: bool
    checks: ImageQualityChecks
    next_status: str
    reason: str | None = None
    message: str | None = None


class ImageUploadForm(BaseModel):
    client_width: int = Field(gt=0)
    client_height: int = Field(gt=0)
    device_orientation: str = Field(min_length=1, max_length=30)


class MeasurementResultApply(BaseModel):
    foot_length_mm: float = Field(gt=0, le=400)
    foot_width_mm: float = Field(gt=0, le=200)
    segmentation_confidence: float | None = Field(default=None, ge=0, le=1)


class MeasurementResultRead(BaseModel):
    result_id: str
    session_id: str
    foot_length_mm: float
    foot_width_mm: float
    segmentation_confidence: float | None = None
    status: str
    measured_at: datetime
