import argparse
import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models import User  # noqa: E402


async def main() -> int:
    parser = argparse.ArgumentParser(description="Promote an existing user to ADMIN.")
    parser.add_argument("--email", required=True, help="User email to promote.")
    args = parser.parse_args()

    if AsyncSessionLocal is None:
        print("DATABASE_URL is not configured.", file=sys.stderr)
        return 1

    email = args.email.strip().lower()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"User not found: {email}", file=sys.stderr)
            return 1

        previous_role = user.role
        user.role = "ADMIN"
        await session.commit()

    print(f"Promoted user: email={email}, previous_role={previous_role}, role=ADMIN")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
