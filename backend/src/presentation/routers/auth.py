from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.auth import (
    authenticate_user,
    create_token_pair,
    get_user_from_refresh_token,
    register_user,
)
from src.core.database import get_session
from src.dto.auth import RefreshTokenRequest, TokenPair
from src.dto.user import UserCreate, UserRead
from redis.asyncio import Redis
from src.core.redis import get_redis

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, session: AsyncSession = Depends(get_session)):
    return await register_user(
        session,
        username=data.username,
        email=data.email,
        password=data.password,
    )


@router.post("/login", response_model=TokenPair)
async def login(
    data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
    redis_client: Redis = Depends(get_redis),
):
    user = await authenticate_user(session, data.username, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await create_token_pair(user.id, redis_client)


@router.post("/refresh", response_model=TokenPair)
async def refresh_tokens(
    data: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session),
    redis_client: Redis = Depends(get_redis),
):
    user = await get_user_from_refresh_token(session, data.refresh_token, redis_client)
    return await create_token_pair(user.id, redis_client)
