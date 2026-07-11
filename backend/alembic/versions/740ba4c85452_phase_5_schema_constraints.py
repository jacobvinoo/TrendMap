"""Phase 5 schema constraints

Revision ID: 740ba4c85452
Revises: 4b99a32f53e7
Create Date: 2026-06-28 21:27:32.168282

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '740ba4c85452'
down_revision: Union[str, Sequence[str], None] = '4b99a32f53e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
