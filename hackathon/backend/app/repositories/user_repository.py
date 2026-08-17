from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_login_id(self, login_id: str) -> User | None:
        result = await self.session.execute(select(User).where(User.login_id == login_id))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        login_id: str,
        email: str | None,
        password_hash: str,
        name: str,
        role: str = "USER",
    ) -> User:
        user = User(
            login_id=login_id,
            email=email,
            password_hash=password_hash,
            name=name,
            role=role,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
