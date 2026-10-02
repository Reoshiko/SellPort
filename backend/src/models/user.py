from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from .base import BaseModel


class User(BaseModel):
    username: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(258), nullable=False)

    orders = relationship("Order", back_populates="user")
