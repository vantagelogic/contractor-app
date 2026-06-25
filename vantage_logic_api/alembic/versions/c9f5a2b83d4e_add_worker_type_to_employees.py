"""add worker_type to employees

Revision ID: c9f5a2b83d4e
Revises: b8e4f1a92c3d
Create Date: 2026-06-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9f5a2b83d4e"
down_revision: Union[str, Sequence[str], None] = "b8e4f1a92c3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("worker_type", sa.String(length=20), nullable=False, server_default="employee"),
    )


def downgrade() -> None:
    op.drop_column("employees", "worker_type")
