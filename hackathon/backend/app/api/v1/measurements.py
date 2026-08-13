from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import api_error
from app.schemas.measurements import (
    ImageUploadForm,
    MeasurementAnalysisRequest,
    MeasurementResultApply,
    MeasurementSessionCreate,
)
from app.services import (
    AuthService,
    MeasurementAnalysisService,
    MeasurementImageService,
    MeasurementResultService,
    MeasurementSessionService,
)

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(session)


def get_measurement_session_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeasurementSessionService:
    return MeasurementSessionService(session)


def get_measurement_image_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeasurementImageService:
    return MeasurementImageService(session)


def get_measurement_analysis_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeasurementAnalysisService:
    return MeasurementAnalysisService(session)


def get_measurement_result_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeasurementResultService:
    return MeasurementResultService(session)


def get_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if credentials is None:
        raise api_error(401, "UNAUTHORIZED", "Authentication token is required.")

    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise api_error(401, "UNAUTHORIZED", "Invalid bearer token format.")
    return credentials.credentials


async def get_current_user_id(
    token: Annotated[str, Depends(get_bearer_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UUID:
    user = await auth_service.get_current_user(token)
    return UUID(user.id)


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_measurement_session(
    payload: MeasurementSessionCreate,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_session_service: Annotated[
        MeasurementSessionService,
        Depends(get_measurement_session_service),
    ],
) -> dict[str, object]:
    measurement_session = await measurement_session_service.create_session(user_id, payload)
    return {
        "success": True,
        "data": {
            "session_id": measurement_session.session_id,
            "status": measurement_session.status,
        },
    }


@router.get("/sessions/{session_id}")
async def get_measurement_session(
    session_id: UUID,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_session_service: Annotated[
        MeasurementSessionService,
        Depends(get_measurement_session_service),
    ],
) -> dict[str, object]:
    measurement_session = await measurement_session_service.get_session(
        user_id=user_id,
        session_id=session_id,
    )
    return {
        "success": True,
        "data": measurement_session.model_dump(),
    }


@router.delete("/sessions/{session_id}")
async def discard_measurement_session(
    session_id: UUID,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_session_service: Annotated[
        MeasurementSessionService,
        Depends(get_measurement_session_service),
    ],
) -> dict[str, object]:
    measurement_session = await measurement_session_service.discard_session(
        user_id=user_id,
        session_id=session_id,
    )
    return {
        "success": True,
        "data": measurement_session.model_dump(),
    }


@router.post("/sessions/{session_id}/image")
async def upload_measurement_image(
    session_id: UUID,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_image_service: Annotated[
        MeasurementImageService,
        Depends(get_measurement_image_service),
    ],
    image: Annotated[UploadFile, File()],
    client_width: Annotated[int, Form(gt=0)],
    client_height: Annotated[int, Form(gt=0)],
    device_orientation: Annotated[str, Form(min_length=1, max_length=30)],
) -> dict[str, object]:
    measurement_image = await measurement_image_service.upload_image(
        user_id=user_id,
        session_id=session_id,
        image=image,
        form=ImageUploadForm(
            client_width=client_width,
            client_height=client_height,
            device_orientation=device_orientation,
        ),
    )
    return {
        "success": True,
        "data": measurement_image.model_dump(),
    }


@router.post("/sessions/{session_id}/validate")
async def validate_measurement_image(
    session_id: UUID,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_image_service: Annotated[
        MeasurementImageService,
        Depends(get_measurement_image_service),
    ],
) -> dict[str, object]:
    validation = await measurement_image_service.validate_image(
        user_id=user_id,
        session_id=session_id,
    )
    if not validation.valid:
        raise api_error(
            409,
            "BUSINESS_RULE_VIOLATION",
            validation.message or "Image quality validation failed.",
            field="image",
            details={"reason": validation.reason, "checks": validation.checks.model_dump()},
        )

    return {
        "success": True,
        "data": validation.model_dump(exclude_none=True),
    }


@router.post("/sessions/{session_id}/analyze")
async def analyze_measurement_image(
    session_id: UUID,
    payload: MeasurementAnalysisRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_analysis_service: Annotated[
        MeasurementAnalysisService,
        Depends(get_measurement_analysis_service),
    ],
) -> dict[str, object]:
    result = await measurement_analysis_service.analyze(
        user_id=user_id,
        session_id=session_id,
        payload=payload,
    )
    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.post("/sessions/{session_id}/result")
async def apply_measurement_result(
    session_id: UUID,
    payload: MeasurementResultApply,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_result_service: Annotated[
        MeasurementResultService,
        Depends(get_measurement_result_service),
    ],
) -> dict[str, object]:
    result = await measurement_result_service.apply_result(
        user_id=user_id,
        session_id=session_id,
        payload=payload,
    )
    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.get("/sessions/{session_id}/result")
async def get_measurement_result(
    session_id: UUID,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    measurement_result_service: Annotated[
        MeasurementResultService,
        Depends(get_measurement_result_service),
    ],
) -> dict[str, object]:
    result = await measurement_result_service.get_result(
        user_id=user_id,
        session_id=session_id,
    )
    return {
        "success": True,
        "data": result.model_dump(),
    }
