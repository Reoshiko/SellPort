from fastapi import APIRouter, Depends
from src.core.auth import get_current_user
from src.dto.user import UserRead
from src.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_current_user(user: User = Depends(get_current_user)):
    return user
