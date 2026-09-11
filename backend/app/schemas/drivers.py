from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.driver import DriverStatus


class DriverBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=7, max_length=50)
    max_work_hours: float = Field(default=8.0, ge=1.0, le=16.0)
    hours_remaining: float = Field(default=8.0, ge=0.0, le=16.0)
    status: DriverStatus = DriverStatus.AVAILABLE
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None


class DriverCreate(DriverBase):
    organization_id: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    max_work_hours: Optional[float] = None
    hours_remaining: Optional[float] = None
    status: Optional[DriverStatus] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None


class DriverResponse(DriverBase):
    id: str
    organization_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
