import asyncio

from sqlalchemy import text

from app.core.database import engine


async def main() -> None:
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured.")

    async with engine.begin() as connection:
        await connection.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(50)")
        )
        await connection.execute(
            text(
                """
                UPDATE users
                SET login_id = 'user_' || replace(id::text, '-', '')
                WHERE login_id IS NULL OR login_id = ''
                """
            )
        )
        await connection.execute(text("ALTER TABLE users ALTER COLUMN login_id SET NOT NULL"))
        await connection.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_login_id ON users (login_id)")
        )
        await connection.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))

    print("USER_LOGIN_ID_MIGRATION=PASS")


if __name__ == "__main__":
    asyncio.run(main())
