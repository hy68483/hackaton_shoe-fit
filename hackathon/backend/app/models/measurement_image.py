from datetime import datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MeasurementImage(Base):
    __tablename__ = "measurement_images"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    measurement_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("measurements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_key: Mapped[str] = mapped_column(String(500), nullable=False)
    mask_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    client_width: Mapped[int] = mapped_column(Integer, nullable=False)
    client_height: Mapped[int] = mapped_column(Integer, nullable=False)
    device_orientation: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
