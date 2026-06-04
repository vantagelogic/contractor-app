"""add active to cost codes

Revision ID: f9caad15fcd1
Revises: 6c2a82bcfe4a
Create Date: 2026-06-03 17:34:46.669627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9caad15fcd1'
down_revision: Union[str, Sequence[str], None] = '6c2a82bcfe4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cost_codes', sa.Column('active', sa.Boolean(), nullable=True, server_default='true'))


def downgrade() -> None:
    op.drop_column('cost_codes', 'active')