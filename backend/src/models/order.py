from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
from .base import BaseModel


class Order(BaseModel):
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    user = relationship("User", back_populates="orders")
