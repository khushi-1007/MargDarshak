from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.simulation import SimulationScenarioType
from app.schemas.orders import OrderCreate


class SimulationScenarioRequest(BaseModel):
    scenario_name: str = Field(..., min_length=2, max_length=255)
    scenario_type: SimulationScenarioType
    
    # Specific parameter options
    removed_vehicle_id: Optional[str] = None
    new_vehicle_capacity_kg: Optional[float] = None
    new_priority_order: Optional[OrderCreate] = None
    road_closure_lat: Optional[float] = None
    road_closure_lng: Optional[float] = None
    road_closure_radius_km: Optional[float] = 2.0
    reduced_driver_hours: Optional[float] = None  # e.g., 4.0 hours
    delivery_window_change: Optional[Dict[str, str]] = None  # {"order_id": "...", "window_start": "...", "window_end": "..."}


class SimulationMetrics(BaseModel):
    total_cost: float
    total_distance_km: float
    total_duration_minutes: float
    late_orders_count: int
    unassigned_orders_count: int
    fleet_utilisation_pct: float
    active_vehicles_count: int


class SimulationDelta(BaseModel):
    cost_delta: float
    distance_delta_km: float
    duration_delta_minutes: float
    sla_violations_delta: int
    unassigned_orders_delta: int


class ScenarioComparisonResponse(BaseModel):
    scenario_name: str
    scenario_type: SimulationScenarioType
    current_plan: SimulationMetrics
    simulated_plan: SimulationMetrics
    difference: SimulationDelta
    recommendations: List[str] = Field(default_factory=list)
    simulated_routes_count: int
