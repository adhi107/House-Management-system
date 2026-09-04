from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class BaseResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    success: bool = True
    data: list = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    total_pages: int = 1


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[dict] = None
