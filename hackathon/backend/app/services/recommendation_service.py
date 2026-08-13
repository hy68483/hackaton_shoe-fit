from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import api_error
from app.models import ProductSize
from app.repositories import FootProfileRepository, ProductRepository
from app.schemas.products import BrandRead
from app.schemas.recommendations import (
    RecommendationRead,
    RecommendationSearchParams,
    RecommendedSizeRead,
)


class RecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self.foot_profile_repository = FootProfileRepository(session)
        self.product_repository = ProductRepository(session)

    async def recommend(
        self,
        *,
        user_id: UUID,
        params: RecommendationSearchParams,
    ) -> RecommendationRead:
        foot_profile = await self.foot_profile_repository.get_by_user_id(user_id)
        if foot_profile is None:
            raise api_error(
                404,
                "NOT_FOUND",
                "Foot profile is required before requesting recommendations.",
            )

        product_id = self._parse_uuid(params.product_id, field="product_id")
        brand_id = self._parse_uuid(params.brand_id, field="brand_id")
        candidates = await self.product_repository.list_recommendation_candidates(
            product_id=product_id,
            brand_id=brand_id,
        )

        foot_length_mm = float(foot_profile.length_mm)
        foot_width_mm = float(foot_profile.width_mm)
        items = sorted(
            [
                self._to_recommended_size_read(
                    product_size,
                    foot_length_mm=foot_length_mm,
                    foot_width_mm=foot_width_mm,
                )
                for product_size in candidates
            ],
            key=lambda item: item.fit_score,
            reverse=True,
        )

        return RecommendationRead(
            foot_length_mm=foot_length_mm,
            foot_width_mm=foot_width_mm,
            items=items[: params.limit],
        )

    def _parse_uuid(self, value: str | None, *, field: str) -> UUID | None:
        if value is None:
            return None
        try:
            return UUID(value)
        except ValueError as exc:
            raise api_error(
                422,
                "VALIDATION_ERROR",
                f"Invalid {field} format.",
                field=field,
            ) from exc

    def _to_recommended_size_read(
        self,
        product_size: ProductSize,
        *,
        foot_length_mm: float,
        foot_width_mm: float,
    ) -> RecommendedSizeRead:
        size_length_mm = float(product_size.length_mm)
        size_width_mm = float(product_size.width_mm)
        length_diff_mm = round(size_length_mm - foot_length_mm, 2)
        width_diff_mm = round(size_width_mm - foot_width_mm, 2)
        fit_score = self._calculate_fit_score(length_diff_mm, width_diff_mm)

        return RecommendedSizeRead(
            product_id=str(product_size.product.id),
            product_name=product_size.product.name,
            brand=BrandRead(
                id=str(product_size.product.brand.id),
                name=product_size.product.brand.name,
            ),
            product_size_id=str(product_size.id),
            size=product_size.size,
            length_mm=size_length_mm,
            width_mm=size_width_mm,
            fit_score=fit_score,
            length_diff_mm=length_diff_mm,
            width_diff_mm=width_diff_mm,
            fit_note=self._fit_note(length_diff_mm, width_diff_mm),
        )

    def _calculate_fit_score(self, length_diff_mm: float, width_diff_mm: float) -> float:
        length_penalty = abs(length_diff_mm - 10.0) * 2.0
        width_penalty = abs(width_diff_mm - 3.0) * 3.0
        undersize_penalty = 0.0
        if length_diff_mm < 0:
            undersize_penalty += abs(length_diff_mm) * 4.0
        if width_diff_mm < 0:
            undersize_penalty += abs(width_diff_mm) * 5.0

        score = 100.0 - length_penalty - width_penalty - undersize_penalty
        return round(max(score, 0.0), 2)

    def _fit_note(self, length_diff_mm: float, width_diff_mm: float) -> str:
        if length_diff_mm < 0 or width_diff_mm < 0:
            return "tight"
        if length_diff_mm <= 15 and width_diff_mm <= 8:
            return "recommended"
        return "roomy"
