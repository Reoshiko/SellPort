from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import Order, User


async def list_user_orders(session: AsyncSession, user: User) -> list[Order]:
    result = await session.execute(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_user_order(session: AsyncSession, user: User, order_id: int) -> Order:
    result = await session.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    return order
