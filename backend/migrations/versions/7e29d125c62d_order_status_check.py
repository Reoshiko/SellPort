"""Constrain order status values.

Revision ID: 7e29d125c62d
Revises: 1489ec6a2475
Create Date: 2026-10-03
"""

from typing import Sequence, Union

from alembic import op

revision: str = "7e29d125c62d"
down_revision: Union[str, Sequence[str], None] = "1489ec6a2475"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "order_status",
        "orders",
        "status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint("order_status", "orders", type_="check")
