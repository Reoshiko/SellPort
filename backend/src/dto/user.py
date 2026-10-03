from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
import re


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=128)
    email: str = Field(max_length=128)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username", "email")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Invalid email address")
        return value


class UserLogin(BaseModel):
    login: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    created_at: datetime
