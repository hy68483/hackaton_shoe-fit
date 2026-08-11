from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MeasurementSessionCreate(BaseModel):
    consent_id: UUID


class MeasurementSessionRead(BaseModel):
    session_id: str
    consent_id: str
    status: str
    confidence: float | None = None
    created_at: datetime
    updated_at: datetime
