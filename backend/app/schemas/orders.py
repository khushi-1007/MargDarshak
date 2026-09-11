from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator
from app.models.order import OrderPriority, OrderStatus
from app.models.vehicle import VehicleType
from app.utils.time import parse_time_to_minutes


class OrderBase(BaseModel):
    external_order_id: str = Field(..., min_length=1, max_length=100)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str = Field(..., min_length=7, max_length=50)
    
    pickup_lat: float = Field(default=26.9124, ge=-90.0, le=90.0)
    pickup_lng: float = Field(default=75.7873, ge=-180.0, le=180.0)
    pickup_address: str = Field(default="Jaipur Central Logistic Hub, Transport Nagar")
    
    delivery_lat: float = Field(..., ge=-90.0, le=90.0)
    delivery_lng: float = Field(..., ge=-180.0, le=180.0)
    delivery_address: str = Field(..., min_length=2)
    
    weight_kg: float = Field(..., gt=0.0)
    priority: OrderPriority = OrderPriority.NORMAL
    window_start: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    window_end: str = Field(default="18:00", pattern=r"^\d{2}:\d{2}$")
    service_duration_minutes: int = Field(default=15, ge=1, le=120)
    required_vehicle_type: Optional[VehicleType] = None

    @model_validator(mode="after")
    def validate_time_window(self):
        start_min = parse_time_to_minutes(self.window_start)
        end_min = parse_time_to_minutes(self.window_end)
        if start_min >= end_min:
            raise ValueError(
                f"window_start ({self.window_start}) must be strictly earlier than window_end ({self.window_end})"
            )
        return self


class OrderCreate(OrderBase):
    organization_id: Optional[str] = None


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_address: Optional[str] = None
    weight_kg: Optional[float] = None
    priority: Optional[OrderPriority] = None
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    service_duration_minutes: Optional[int] = None
    required_vehicle_type: Optional[VehicleType] = None
    status: Optional[OrderStatus] = None
    assigned_vehicle_id: Optional[str] = None


class OrderResponse(OrderBase):
    id: str
    status: OrderStatus
    assigned_vehicle_id: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderImportResult(BaseModel):
    total_imported: int
    failed_rows: int
    errors: List[dict] = Field(default_factory=list)
