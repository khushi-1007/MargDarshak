from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from app.models.route import RouteStatus
from app.models.route_stop import StopStatus
from app.schemas.orders import OrderResponse


class RouteStopResponse(BaseModel):
    id: str
    route_id: str
    order_id: Optional[str] = None
    sequence: int
    planned_arrival: str
    planned_departure: str
    actual_arrival: Optional[str] = None
    actual_departure: Optional[str] = None
    status: StopStatus
    order: Optional[OrderResponse] = None

    model_config = {"from_attributes": True}


class RouteResponse(BaseModel):
    id: str
    optimisation_run_id: str
    vehicle_id: str
    total_distance_km: float
    total_duration_minutes: float
    total_cost: float
    expected_fuel_cost: float
    expected_toll_cost: float
    expected_overtime_cost: float
    late_delivery_penalty: float
    status: RouteStatus
    version: int
    created_at: datetime
    updated_at: datetime
    stops: List[RouteStopResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class RouteVersionResponse(BaseModel):
    id: str
    route_id: str
    version_number: int
    snapshot_json: dict
    change_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
