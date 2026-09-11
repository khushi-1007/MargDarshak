from typing import Any, Dict, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: T, meta: Optional[Dict[str, Any]] = None) -> "ApiResponse[T]":
        return cls(success=True, data=data, meta=meta or {})

    @classmethod
    def fail(cls, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> "ApiResponse[None]":
        return cls(success=False, error=ErrorDetail(code=code, message=message, details=details or {}))
