"""add user profile fields

Revision ID: c7d1f4a2b901
Revises: b389592974f8
"""
from alembic import op
import sqlalchemy as sa

revision = "c7d1f4a2b901"
down_revision = "b389592974f8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("username", sa.String(64), nullable=True))
    op.add_column("user", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("user", sa.Column("nickname", sa.String(64), nullable=True))
    op.add_column("user", sa.Column("avatar_url", sa.Text(), nullable=True))
    op.execute("UPDATE \"user\" SET username = 'user_' || left(id::text, 8) WHERE username IS NULL")
    op.alter_column("user", "username", nullable=False)
    op.create_index("ix_user_username", "user", ["username"], unique=True)
    op.create_index("ix_user_phone", "user", ["phone"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_phone", table_name="user")
    op.drop_index("ix_user_username", table_name="user")
    op.drop_column("user", "avatar_url")
    op.drop_column("user", "nickname")
    op.drop_column("user", "phone")
    op.drop_column("user", "username")
