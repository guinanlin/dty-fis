import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi_users.password import PasswordHelper
from fastapi_users import InvalidPasswordException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.model.base_model import User
from app.schemas import UserCreate, UserRead
from app.users import get_user_manager

router = APIRouter()
logger = logging.getLogger(__name__)


class ForgotPasswordRequest(BaseModel):
    account: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


def error(code: str, reason: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"code": code, "reason": reason})


@router.post("/register", response_model=UserRead, status_code=201)
async def register(data: UserCreate, session: AsyncSession = Depends(get_async_session)):
    checks = ((User.username == data.username, "REGISTER_USERNAME_EXISTS", "该用户名已被注册"),
              (User.email == data.email, "REGISTER_EMAIL_EXISTS", "该邮箱已被注册"),
              (User.phone == data.phone, "REGISTER_PHONE_EXISTS", "该手机号已被注册"))
    for condition, code, reason in checks:
        if (await session.execute(select(User).where(condition))).scalar_one_or_none():
            raise error(code, reason)
    try:
        from app.users import UserManager
        await UserManager.validate_password(None, data.password, data)
    except InvalidPasswordException as exc:
        raise error("INVALID_PASSWORD", ", ".join(exc.reason)) from exc
    user = User(id=uuid.uuid4(), email=data.email, username=data.username,
                phone=data.phone, nickname=data.nickname,
                hashed_password=PasswordHelper().hash(data.password),
                is_active=True, is_superuser=False, is_verified=False)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info("User registered: %s", user.id)
    return user


@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest, request: Request,
                          session: AsyncSession = Depends(get_async_session),
                          user_manager=Depends(get_user_manager)):
    user = (await session.execute(select(User).where(or_(User.email == request_data.account,
        User.username == request_data.account, User.phone == request_data.account)))).scalar_one_or_none()
    response = {"message": "如果该账号存在，重置链接已发送到您的邮箱"}
    if user is not None:
        token = await user_manager.forgot_password(user, request)
        if settings.EMAIL_DEV_MODE:
            link = f"{settings.FRONTEND_URL}/password-recovery/confirm?token={token}"
            response.update({"reset_token": token, "reset_link": link})
            logger.info("Password reset link: %s", link)
    return response


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, request: Request,
                         user_manager=Depends(get_user_manager)):
    try:
        await user_manager.reset_password(data.token, data.password, request)
    except InvalidPasswordException as exc:
        raise error("INVALID_PASSWORD", ", ".join(exc.reason)) from exc
    except Exception as exc:
        raise error("INVALID_TOKEN", "重置链接无效或已过期") from exc
    return {"message": "密码重置成功"}
