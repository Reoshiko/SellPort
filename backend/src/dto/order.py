from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from decimal import Decimal
from src.models.order import OrderStatus


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: OrderStatus
    total_price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    created_at: datetime


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
