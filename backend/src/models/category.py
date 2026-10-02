from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from .base import BaseModel


class Category(BaseModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    products = relationship("Product", back_populates="category")
