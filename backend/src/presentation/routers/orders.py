from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.auth import get_current_user
from src.core.database import get_session
from src.dto.order import OrderRead
from src.models import User
from src.presentation.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def read_orders(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await order_service.list_user_orders(session, user)


@router.get("/{order_id}", response_model=OrderRead)
async def read_order(
    order_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await order_service.get_user_order(session, user, order_id)
