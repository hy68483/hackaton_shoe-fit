from datetime import datetime

from pydantic import BaseModel, Field


class ConsentCreate(BaseModel):
    measurement_data: bool
    image_storage: bool
    policy_version: str = Field(min_length=1, max_length=30)


class ConsentRead(BaseModel):
    id: str
    measurement_data: bool
    image_storage: bool
    policy_version: str
    agreed_at: datetime
    revoked_at: datetime | None = None
