"""add canvas tables

Revision ID: 2026_08_30_0003
Revises: 2026_08_30_0002
Create Date: 2026-08-30 17:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2026_08_30_0003'
down_revision: Union[str, None] = '2026_08_30_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. canvases
    op.create_table(
        'canvases',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_canvases_project_id'), 'canvases', ['project_id'], unique=False)

    # 2. canvas_items
    op.create_table(
        'canvas_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('canvas_id', sa.UUID(), nullable=False),
        sa.Column('item_type', sa.String(length=50), nullable=False),
        sa.Column('ref_id', sa.UUID(), nullable=True),
        sa.Column('position_x', sa.Float(), nullable=False),
        sa.Column('position_y', sa.Float(), nullable=False),
        sa.Column('content', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['canvas_id'], ['canvases.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_canvas_items_canvas_id'), 'canvas_items', ['canvas_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_canvas_items_canvas_id'), table_name='canvas_items')
    op.drop_table('canvas_items')
    op.drop_index(op.f('ix_canvases_project_id'), table_name='canvases')
    op.drop_table('canvases')
