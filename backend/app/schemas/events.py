from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.event import EventType, EventSeverity, EventStatus
from app.schemas.orders import OrderCreate


class EventCreate(BaseModel):
    type: EventType
    severity: EventSeverity = EventSeverity.MEDIUM
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    radius_km: Optional[float] = 2.0
    vehicle_id: Optional[str] = None
    order_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EventSimulateRequest(BaseModel):
    type: EventType
    title: Optional[str] = None
    description: Optional[str] = None
    vehicle_id: Optional[str] = None
    order_id: Optional[str] = None
    new_order: Optional[OrderCreate] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    radius_km: Optional[float] = 2.0
    delay_factor: Optional[float] = 1.8   # For traffic / rain
    road_closed_segment: Optional[str] = None


class ImpactSummary(BaseModel):
    event_id: Optional[str] = None
    trigger: str
    routes_changed: int
    orders_reassigned: int
    cost_delta: float
    distance_delta_km: float
    eta_delta_minutes: float
    sla_violations_added: int
    vehicles_affected: List[str] = Field(default_factory=list)
    affected_orders: List[str] = Field(default_factory=list)
    mitigation_recommendations: List[str] = Field(default_factory=list)
    optimisation_run_id: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    type: EventType
    severity: EventSeverity
    title: str
    description: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    radius_km: Optional[float] = None
    vehicle_id: Optional[str] = None
    order_id: Optional[str] = None
    affected_route_id: Optional[str] = None
    status: EventStatus
    event_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}
