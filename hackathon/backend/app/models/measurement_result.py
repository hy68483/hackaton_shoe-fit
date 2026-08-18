from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MeasurementResult(Base):
    __tablename__ = "measurement_results"
    __table_args__ = (
        UniqueConstraint("measurement_id", name="uq_measurement_results_measurement_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    measurement_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("measurements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    foot_length_mm: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    foot_width_mm: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    segmentation_confidence: Mapped[Decimal | None] = mapped_column(Numeric(4, 3), nullable=True)
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
