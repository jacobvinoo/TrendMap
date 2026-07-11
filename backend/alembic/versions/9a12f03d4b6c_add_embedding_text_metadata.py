"""add embedding text and metadata

Revision ID: 9a12f03d4b6c
Revises: 740ba4c85452
Create Date: 2026-06-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a12f03d4b6c"
down_revision: Union[str, Sequence[str], None] = "740ba4c85452"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("embeddings", sa.Column("text_content", sa.Text(), nullable=True))
    op.add_column("embeddings", sa.Column("metadata_json", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("embeddings", "metadata_json")
    op.drop_column("embeddings", "text_content")
