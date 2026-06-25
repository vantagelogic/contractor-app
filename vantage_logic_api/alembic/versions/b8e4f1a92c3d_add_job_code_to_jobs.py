"""add job_code to jobs

Revision ID: b8e4f1a92c3d
Revises: 91d364bc2ff0
Create Date: 2026-06-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e4f1a92c3d"
down_revision: Union[str, Sequence[str], None] = "91d364bc2ff0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("job_code", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "job_code")
