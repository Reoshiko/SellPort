from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import RedirectResponse
from src.core.auth import get_current_user
from src.core.database import get_session
from src.dto.product import ProductCreate, ProductRead, ProductUpdate
from src.models import User
from src.presentation.services import product_service
from uuid import uuid4

router = APIRouter(prefix="/products", tags=["products"])
image_types = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
max_image_size = 5 * 1024 * 1024


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


@router.get("/{product_id}/image")
async def read_product_image(
    product_id: int, session: AsyncSession = Depends(get_session)
):
    image_url = await product_service.get_product_image_url(session, product_id)
    return RedirectResponse(image_url)


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


@router.post("/{product_id}/image", response_model=ProductRead)
async def upload_product_image(
    product_id: int,
    image: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    extension = image_types.get(image.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type",
        )
    content = await image.read(max_image_size + 1)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image cannot be empty",
        )
    if len(content) > max_image_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be 5 MB or smaller",
        )
    object_name = f"products/{product_id}/{uuid4().hex}{extension}"
    return await product_service.set_product_image(
        session, product_id, object_name, content, image.content_type or ""
    )


@router.delete("/{product_id}/image", response_model=ProductRead)
async def delete_product_image(
    product_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await product_service.remove_product_image(session, product_id)
