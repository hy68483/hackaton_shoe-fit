from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Measurement, MeasurementImage, MeasurementResult


class MeasurementRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_session(
        self,
        *,
        user_id: UUID,
        consent_id: UUID,
    ) -> Measurement:
        measurement = Measurement(user_id=user_id, consent_id=consent_id)
        self.session.add(measurement)
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement

    async def get_session_for_user(
        self,
        *,
        session_id: UUID,
        user_id: UUID,
    ) -> Measurement | None:
        result = await self.session.execute(
            select(Measurement).where(
                Measurement.session_id == session_id,
                Measurement.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def discard_session_for_user(
        self,
        *,
        session_id: UUID,
        user_id: UUID,
    ) -> Measurement | None:
        measurement = await self.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            return None

        measurement.status = "DISCARDED"
        measurement.discarded_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement

    async def update_status(
        self,
        measurement: Measurement,
        status: str,
    ) -> Measurement:
        measurement.status = status
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement

    async def create_image(
        self,
        *,
        measurement: Measurement,
        original_key: str,
        content_type: str,
        file_size_bytes: int,
        client_width: int,
        client_height: int,
        device_orientation: str,
    ) -> MeasurementImage:
        measurement_image = MeasurementImage(
            measurement_id=measurement.id,
            original_key=original_key,
            content_type=content_type,
            file_size_bytes=file_size_bytes,
            client_width=client_width,
            client_height=client_height,
            device_orientation=device_orientation,
        )
        measurement.status = "IMAGE_UPLOADED"
        self.session.add(measurement_image)
        await self.session.commit()
        await self.session.refresh(measurement)
        await self.session.refresh(measurement_image)
        return measurement_image

    async def get_latest_image(self, measurement_id: UUID) -> MeasurementImage | None:
        result = await self.session.execute(
            select(MeasurementImage)
            .where(MeasurementImage.measurement_id == measurement_id)
            .order_by(MeasurementImage.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_images_by_ids(
        self,
        *,
        measurement_id: UUID,
        image_ids: list[UUID],
    ) -> list[MeasurementImage]:
        result = await self.session.execute(
            select(MeasurementImage).where(
                MeasurementImage.measurement_id == measurement_id,
                MeasurementImage.id.in_(image_ids),
            )
        )
        return list(result.scalars().all())

    async def upsert_result(
        self,
        *,
        measurement: Measurement,
        foot_length_mm: Decimal,
        foot_width_mm: Decimal,
        segmentation_confidence: Decimal | None,
    ) -> MeasurementResult:
        result = await self.get_result(measurement.id)
        if result is None:
            result = MeasurementResult(measurement_id=measurement.id)
            self.session.add(result)

        result.foot_length_mm = foot_length_mm
        result.foot_width_mm = foot_width_mm
        result.segmentation_confidence = segmentation_confidence
        result.measured_at = datetime.now(timezone.utc)
        measurement.confidence = segmentation_confidence
        measurement.status = "COMPLETED"

        await self.session.commit()
        await self.session.refresh(measurement)
        await self.session.refresh(result)
        return result

    async def get_result(self, measurement_id: UUID) -> MeasurementResult | None:
        result = await self.session.execute(
            select(MeasurementResult).where(MeasurementResult.measurement_id == measurement_id)
        )
        return result.scalar_one_or_none()
