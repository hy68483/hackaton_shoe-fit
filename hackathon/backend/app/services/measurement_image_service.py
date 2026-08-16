from pathlib import Path
from uuid import UUID, uuid4

import cv2
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import MeasurementImage
from app.repositories import MeasurementRepository
from app.schemas.measurements import (
    ImageQualityChecks,
    ImageUploadForm,
    ImageValidationRead,
    MeasurementImageRead,
)
from app.services.opencv_service import OpenCVService


class MeasurementImageService:
    allowed_content_types = {"image/jpeg", "image/png", "image/webp"}
    max_file_size_bytes = 10 * 1024 * 1024

    def __init__(self, session: AsyncSession) -> None:
        self.measurement_repository = MeasurementRepository(session)
        self.opencv_service = OpenCVService()

    async def upload_image(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        image: UploadFile,
        form: ImageUploadForm,
    ) -> MeasurementImageRead:
        measurement = await self.measurement_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")

        if measurement.status == "DISCARDED":
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Discarded measurement session cannot receive an image.",
            )

        content_type = image.content_type or ""
        if content_type not in self.allowed_content_types:
            raise api_error(
                422,
                "VALIDATION_ERROR",
                "Unsupported image content type.",
                field="image",
                details={"allowed_content_types": sorted(self.allowed_content_types)},
            )

        image_bytes = await image.read()
        if not image_bytes:
            raise api_error(422, "VALIDATION_ERROR", "Image file is empty.", field="image")

        if len(image_bytes) > self.max_file_size_bytes:
            raise api_error(
                413,
                "PAYLOAD_TOO_LARGE",
                "Image file is too large.",
                field="image",
                details={"max_file_size_bytes": self.max_file_size_bytes},
            )

        original_key = self._save_image(
            session_id=session_id,
            image=image,
            image_bytes=image_bytes,
        )
        measurement_image = await self.measurement_repository.create_image(
            measurement=measurement,
            original_key=original_key,
            content_type=content_type,
            file_size_bytes=len(image_bytes),
            client_width=form.client_width,
            client_height=form.client_height,
            device_orientation=form.device_orientation,
        )
        return self._to_image_read(
            measurement_image,
            session_id=session_id,
            status="IMAGE_UPLOADED",
        )

    async def validate_image(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
    ) -> ImageValidationRead:
        measurement = await self.measurement_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if measurement is None:
            raise api_error(404, "NOT_FOUND", "Measurement session not found.")

        measurement_image = await self.measurement_repository.get_latest_image(measurement.id)
        if measurement_image is None:
            raise api_error(
                409,
                "BUSINESS_RULE_VIOLATION",
                "Measurement image must be uploaded before validation.",
            )

        await self.measurement_repository.update_status(measurement, "VALIDATING")
        validation = self.opencv_service.validate_image(
            cv2.imread(str(Path(measurement_image.original_key)))
        )
        checks = validation["checks"]
        valid = bool(validation["valid"])
        next_status = "SEGMENTING" if valid else "RETAKE_REQUIRED"
        await self.measurement_repository.update_status(measurement, next_status)

        return ImageValidationRead(
            valid=valid,
            checks=ImageQualityChecks(**checks),
            next_status=next_status,
            reason=None if valid else str(validation["reason"]),
            message=None if valid else "Image quality validation failed. Please retake the photo.",
        )

    def _save_image(
        self,
        *,
        session_id: UUID,
        image: UploadFile,
        image_bytes: bytes,
    ) -> str:
        extension = self._extension_for_content_type(image.content_type or "")
        output_dir = Path("output") / "measurements" / str(session_id)
        output_dir.mkdir(parents=True, exist_ok=True)
        image_path = output_dir / f"{uuid4()}{extension}"
        image_path.write_bytes(image_bytes)
        return str(image_path)

    def _extension_for_content_type(self, content_type: str) -> str:
        return {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(content_type, ".bin")

    def _first_failed_reason(self, checks: dict[str, bool]) -> str:
        for key, passed in checks.items():
            if not passed:
                return key.upper()
        return "UNKNOWN"

    def _to_image_read(
        self,
        measurement_image: MeasurementImage,
        *,
        session_id: UUID,
        status: str,
    ) -> MeasurementImageRead:
        return MeasurementImageRead(
            image_id=str(measurement_image.id),
            session_id=str(session_id),
            original_key=measurement_image.original_key,
            content_type=measurement_image.content_type,
            file_size_bytes=measurement_image.file_size_bytes,
            client_width=measurement_image.client_width,
            client_height=measurement_image.client_height,
            device_orientation=measurement_image.device_orientation,
            status=status,
        )
