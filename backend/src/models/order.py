from sqlalchemy import Enum as SqlEnum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
from enum import Enum
from .base import BaseModel


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(BaseModel):
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        SqlEnum(
            OrderStatus,
            name="order_status",
            native_enum=False,
            create_constraint=True,
            length=32,
            values_callable=lambda statuses: [status.value for status in statuses],
        ),
        nullable=False,
        default=OrderStatus.PENDING,
    )
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    user = relationship("User", back_populates="orders")
