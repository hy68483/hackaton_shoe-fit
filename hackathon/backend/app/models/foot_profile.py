from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FootProfile(Base):
    __tablename__ = "foot_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_foot_profiles_user_id"),)

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    length_mm: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    width_mm: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    confidence: Mapped[Decimal | None] = mapped_column(Numeric(4, 3), nullable=True)
    measurement_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    measured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
