import asyncio
import os
import uuid

from dotenv import load_dotenv
from fastapi_users.password import PasswordHelper
from sqlalchemy import select

from app.core.database import async_session_maker
from app.model.base_model import User
import app.model.item_model  # noqa: F401 — register Item for User relationship

load_dotenv()

SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@datangyuan.cn")
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "123456")


async def seed_admin() -> None:
    async with async_session_maker() as session:
        users = [("admin", SEED_ADMIN_EMAIL, "管理员", "13800000001", True),
                 ("zhangsan", "zhangsan@datangyuan.cn", "张三", "13800000002", False)]
        for username, email, nickname, phone, is_superuser in users:
            user = (await session.execute(select(User).where(User.username == username))).scalar_one_or_none()
            if user is None:
                session.add(User(id=uuid.uuid4(), username=username, email=email, nickname=nickname,
                    phone=phone, hashed_password=PasswordHelper().hash(SEED_ADMIN_PASSWORD),
                    is_active=True, is_superuser=is_superuser, is_verified=True))
        await session.commit()
        print("Seeded admin and zhangsan users")


if __name__ == "__main__":
    asyncio.run(seed_admin())
