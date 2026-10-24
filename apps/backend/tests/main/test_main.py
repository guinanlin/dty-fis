import pytest
from fastapi import status
from sqlalchemy import select
from app.model.base_model import User


class TestPasswordValidation:
    @pytest.mark.parametrize(
        "password",
        [
            "short",
            "     ",
        ],
    )
    @pytest.mark.asyncio(loop_scope="function")
    async def test_password_validation(
        self, test_client, password
    ):
        """Test user registration with password validation."""
        json = {"username": "testuser", "phone": "13800000001",
                "email": "test@example.com", "password": password}
        response = await test_client.post("/auth/register", json=json)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"]["code"] == "INVALID_PASSWORD"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_register_user_with_valid_password(self, test_client, db_session):
        """Test user registration with success"""
        json = {
            "username": "testuser",
            "phone": "13800000001",
            "email": "user@1.com",
            "password": "123456",
        }
        response = await test_client.post("/auth/register", json=json)

        row = await db_session.execute(select(User))

        user = row.scalars().first()

        assert response.status_code == status.HTTP_201_CREATED
        assert user is not None
        assert user.email == "user@1.com"
        assert user.username == "testuser"
