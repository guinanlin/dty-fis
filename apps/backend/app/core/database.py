from typing import AsyncGenerator
from uuid import UUID
from urllib.parse import urlparse

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import NullPool, or_, select
from fastapi_users.password import PasswordHelper
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.model.base_model import Base, User


parsed_db_url = urlparse(settings.DATABASE_URL)

async_db_connection_url = (
    f"postgresql+asyncpg://{parsed_db_url.username}:{parsed_db_url.password}@"
    f"{parsed_db_url.hostname}{':' + str(parsed_db_url.port) if parsed_db_url.port else ''}"
    f"{parsed_db_url.path}"
)

# Disable connection pooling for serverless environments like Vercel
engine = create_async_engine(async_db_connection_url, poolclass=NullPool)

async_session_maker = async_sessionmaker(
    engine, expire_on_commit=settings.EXPIRE_ON_COMMIT
)


class FinanceUserDatabase(SQLAlchemyUserDatabase[User, UUID]):
    async def authenticate(self, credentials):
        result = await self.session.execute(
            select(self.user_table).where(
                or_(
                    self.user_table.email == credentials.username,
                    self.user_table.username == credentials.username,
                    (self.user_table.phone.is_not(None))
                    & (self.user_table.phone == credentials.username),
                )
            )
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        verified, updated_password = PasswordHelper().verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None
        if updated_password:
            user.hashed_password = updated_password
            await self.session.commit()
        return user


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield FinanceUserDatabase(session, User)
