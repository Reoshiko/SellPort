from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.dto.product import ProductCreate, ProductUpdate
from src.models import Category, Product
from src.core.storage import delete_object, download_object, upload_object
import asyncio


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
    if product.image_object_name is not None:
        await asyncio.to_thread(delete_object, product.image_object_name)
    await session.delete(product)
    await session.commit()


async def set_product_image(
    session: AsyncSession,
    product_id: int,
    object_name: str,
    content: bytes,
    content_type: str,
) -> Product:
    product = await get_product(session, product_id)
    previous_object_name = product.image_object_name
    await asyncio.to_thread(upload_object, object_name, content, content_type)
    product.image_object_name = object_name
    try:
        await session.commit()
    except Exception:
        await session.rollback()
        await asyncio.to_thread(delete_object, object_name)
        raise
    await session.refresh(product)
    if previous_object_name is not None:
        await asyncio.to_thread(delete_object, previous_object_name)
    return product


async def remove_product_image(session: AsyncSession, product_id: int) -> Product:
    product = await get_product(session, product_id)
    object_name = product.image_object_name
    if object_name is None:
        return product
    product.image_object_name = None
    await session.commit()
    await session.refresh(product)
    await asyncio.to_thread(delete_object, object_name)
    return product


async def get_product_image(
    session: AsyncSession, product_id: int
) -> tuple[bytes, str]:
    product = await get_product(session, product_id)
    if product.image_object_name is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product image not found"
        )
    return await asyncio.to_thread(download_object, product.image_object_name)
