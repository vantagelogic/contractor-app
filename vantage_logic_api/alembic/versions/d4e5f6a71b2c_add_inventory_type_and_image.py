"""add item_type and image_path to inventory

Revision ID: d4e5f6a71b2c
Revises: c9f5a2b83d4e
Create Date: 2026-06-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a71b2c"
down_revision: Union[str, Sequence[str], None] = "c9f5a2b83d4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inventory", sa.Column("item_type", sa.String(length=50), nullable=True))
    op.add_column("inventory", sa.Column("image_path", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("inventory", "image_path")
    op.drop_column("inventory", "item_type")
