from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.dto.category import CategoryCreate, CategoryUpdate
from src.models import Category


async def list_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


async def get_category(session: AsyncSession, category_id: int) -> Category:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    return category


async def create_category(session: AsyncSession, data: CategoryCreate) -> Category:
    category = Category(name=data.name)
    session.add(category)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name already exists",
        ) from exc
    await session.refresh(category)
    return category


async def update_category(
    session: AsyncSession, category_id: int, data: CategoryUpdate
) -> Category:
    category = await get_category(session, category_id)
    values = data.model_dump(exclude_unset=True)
    if "name" in values and values["name"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="name cannot be null",
        )
    for key, value in values.items():
        setattr(category, key, value)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name already exists",
        ) from exc
    await session.refresh(category)
    return category


async def delete_category(session: AsyncSession, category_id: int) -> None:
    category = await get_category(session, category_id)
    await session.delete(category)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category has products and cannot be deleted",
        ) from exc
