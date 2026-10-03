from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.auth import get_current_user
from src.core.database import get_session
from src.dto.category import CategoryCreate, CategoryRead, CategoryUpdate
from src.models import User
from src.presentation.services import category_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
async def read_categories(session: AsyncSession = Depends(get_session)):
    return await category_service.list_categories(session)


@router.get("/{category_id}", response_model=CategoryRead)
async def read_category(category_id: int, session: AsyncSession = Depends(get_session)):
    return await category_service.get_category(session, category_id)


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await category_service.create_category(session, data)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await category_service.update_category(session, category_id, data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await category_service.delete_category(session, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
