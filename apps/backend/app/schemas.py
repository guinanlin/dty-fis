import uuid

from fastapi_users import schemas
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


class UserRead(schemas.BaseUser[uuid.UUID]):
    username: str
    phone: str | None = None
    nickname: str | None = None
    avatar_url: str | None = None
    model_config = {"from_attributes": True}


class UserCreate(schemas.BaseUserCreate):
    username: str = Field(min_length=2, max_length=64)
    phone: str = Field(pattern=r"^1\d{10}$", description="手机号格式不正确")
    nickname: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        import re
        if not re.fullmatch(r"1\d{10}", value):
            raise ValueError("手机号格式不正确")
        return value


class UserUpdate(schemas.BaseUserUpdate):
    nickname: str | None = None
    avatar_url: str | None = None


class ItemBase(BaseModel):
    name: str
    description: str | None = None
    quantity: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    size: int
    mime_type: str
    status: str
    download_url: str


class FileDownloadResponse(BaseModel):
    file_id: str
    download_url: str
    expires_in: int
