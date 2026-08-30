"""add error_message to documents

Revision ID: 2026_08_30_0002
Revises: 2026_08_30_0001
Create Date: 2026-08-30 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2026_08_30_0002'
down_revision: Union[str, None] = '2026_08_30_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'error_message')
