from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.vehicle import VehicleStatus, VehicleType, FuelType


class VehicleBase(BaseModel):
    vehicle_number: str = Field(..., min_length=3, max_length=50)
    vehicle_type: VehicleType = VehicleType.LIGHT_COMMERCIAL
    capacity_kg: float = Field(..., gt=0.0)
    current_load_kg: float = Field(default=0.0, ge=0.0)
    fuel_type: FuelType = FuelType.DIESEL
    
    cost_per_km: float = Field(default=12.0, ge=0.0)
    fuel_cost_per_km: float = Field(default=8.0, ge=0.0)
    toll_factor: float = Field(default=1.0, ge=0.0)
    overtime_cost_per_minute: float = Field(default=3.5, ge=0.0)
    
    current_lat: float = Field(default=26.9124)
    current_lng: float = Field(default=75.7873)
    available_from: str = Field(default="08:00")
    available_until: str = Field(default="20:00")


class VehicleCreate(VehicleBase):
    driver_id: Optional[str] = None
    organization_id: Optional[str] = None


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    capacity_kg: Optional[float] = None
    current_load_kg: Optional[float] = None
    fuel_type: Optional[FuelType] = None
    cost_per_km: Optional[float] = None
    fuel_cost_per_km: Optional[float] = None
    toll_factor: Optional[float] = None
    overtime_cost_per_minute: Optional[float] = None
    driver_id: Optional[str] = None
    status: Optional[VehicleStatus] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    available_from: Optional[str] = None
    available_until: Optional[str] = None


class VehicleBreakdownRequest(BaseModel):
    reason: Optional[str] = "Engine failure / mechanical breakdown"
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None


class VehicleResponse(VehicleBase):
    id: str
    driver_id: Optional[str] = None
    status: VehicleStatus
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
