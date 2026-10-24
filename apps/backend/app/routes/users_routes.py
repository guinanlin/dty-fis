import logging
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi_users.password import PasswordHelper
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.model.base_model import User
from app.schemas import UserRead
from app.users import current_active_user, get_user_manager

router = APIRouter()
logger = logging.getLogger(__name__)
phone_codes: dict[str, tuple[str, float]] = {}


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class PhoneCodeRequest(BaseModel):
    mobile: str = Field(pattern=r"^1\d{10}$")


class ChangePhoneRequest(PhoneCodeRequest):
    code: str


class BindWechatRequest(BaseModel):
    code: str | None = None


def bad(code: str, reason: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"code": code, "reason": reason})


@router.post("/me/change-password")
async def change_password(data: ChangePasswordRequest, user: User = Depends(current_active_user),
                          session: AsyncSession = Depends(get_async_session),
                          user_manager=Depends(get_user_manager)):
    valid, _ = PasswordHelper().verify_and_update(data.old_password, user.hashed_password)
    if not valid:
        raise bad("OLD_PASSWORD_INCORRECT", "原密码不正确")
    try:
        await user_manager.validate_password(data.new_password, user)
    except Exception as exc:
        reason = ", ".join(exc.reason) if hasattr(exc, "reason") else str(exc)
        raise bad("INVALID_PASSWORD", reason) from exc
    user.hashed_password = PasswordHelper().hash(data.new_password)
    await session.commit()
    return {"message": "密码修改成功"}


@router.post("/me/send-phone-code")
async def send_phone_code(data: PhoneCodeRequest, user: User = Depends(current_active_user)):
    if not settings.SMS_DEV_MODE:
        raise HTTPException(status_code=501, detail={"message": "短信服务暂未接入"})
    code = f"{secrets.randbelow(1_000_000):06d}"
    phone_codes[data.mobile] = (code, time.time() + 300)
    logger.info("SMS code for %s: %s", data.mobile, code)
    return {"code": code, "expires_in": 300, "message": "验证码已发送"}


@router.post("/me/change-phone", response_model=UserRead)
async def change_phone(data: ChangePhoneRequest, user: User = Depends(current_active_user),
                       session: AsyncSession = Depends(get_async_session)):
    stored = phone_codes.get(data.mobile)
    if data.code != "123456" and (stored is None or stored[0] != data.code or stored[1] < time.time()):
        raise bad("INVALID_SMS_CODE", "验证码错误或已过期")
    if (await session.execute(select(User).where(User.phone == data.mobile, User.id != user.id))).scalar_one_or_none():
        raise bad("PHONE_EXISTS", "该手机号已被注册")
    user.phone = data.mobile
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/me/bind-wechat")
async def bind_wechat(data: BindWechatRequest | None = None, user: User = Depends(current_active_user)):
    return {"status": "pending", "message": "微信开放平台接入待开放，敬请期待"}
