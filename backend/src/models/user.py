from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from .base import BaseModel


class User(BaseModel):
    username: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(258), nullable=False)
