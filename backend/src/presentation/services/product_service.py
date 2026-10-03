from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.dto.product import ProductCreate, ProductUpdate
from src.models import Category, Product


async def list_products(
    session: AsyncSession,
    offset: int = 0,
    limit: int = 50,
    category_id: int | None = None,
) -> list[Product]:
    query = select(Product).order_by(Product.id).offset(offset).limit(limit)
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_product(session: AsyncSession, product_id: int) -> Product:
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


async def create_product(session: AsyncSession, data: ProductCreate) -> Product:
    category = await session.get(Category, data.category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    product = Product(**data.model_dump())
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def update_product(
    session: AsyncSession, product_id: int, data: ProductUpdate
) -> Product:
    product = await get_product(session, product_id)
    values = data.model_dump(exclude_unset=True)
    for key in ("name", "price", "stock", "category_id"):
        if key in values and values[key] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{key} cannot be null",
            )
    if values.get("category_id") is not None:
        category = await session.get(Category, values["category_id"])
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )
    for key, value in values.items():
        setattr(product, key, value)
    await session.commit()
    await session.refresh(product)
    return product


async def delete_product(session: AsyncSession, product_id: int) -> None:
    product = await get_product(session, product_id)
    await session.delete(product)
    await session.commit()
