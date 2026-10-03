from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.auth import get_current_user
from src.core.database import get_session
from src.dto.product import ProductCreate, ProductRead, ProductUpdate
from src.models import User
from src.presentation.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
async def read_products(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    category_id: int | None = Query(default=None, gt=0),
    session: AsyncSession = Depends(get_session),
):
    return await product_service.list_products(session, offset, limit, category_id)


@router.get("/{product_id}", response_model=ProductRead)
async def read_product(product_id: int, session: AsyncSession = Depends(get_session)):
    return await product_service.get_product(session, product_id)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await product_service.create_product(session, data)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await product_service.update_product(session, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await product_service.delete_product(session, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
