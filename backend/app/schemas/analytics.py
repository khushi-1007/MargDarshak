from typing import Any, Dict, List
from pydantic import BaseModel, Field


class OverviewMetrics(BaseModel):
    total_orders: int
    active_vehicles: int
    completed_deliveries: int
    pending_deliveries: int
    on_time_delivery_pct: float
    total_distance_km: float
    total_operating_cost: float
    cost_per_delivery: float
    total_sla_violations: int
    active_events_count: int


class CostMetrics(BaseModel):
    total_cost: float
    base_distance_cost: float
    fuel_cost: float
    toll_cost: float
    overtime_cost: float
    late_penalty_cost: float
    cost_breakdown_by_vehicle: Dict[str, float] = Field(default_factory=dict)


class SLAMetrics(BaseModel):
    total_orders: int
    on_time_orders: int
    late_orders: int
    on_time_rate_pct: float
    avg_delay_minutes: float
    critical_sla_breaches: int
    high_sla_breaches: int


class UtilisationMetrics(BaseModel):
    total_fleet_capacity_kg: float
    used_capacity_kg: float
    fleet_utilisation_pct: float
    vehicle_utilisation: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    active_hours_total: float


class PlanVsActualItem(BaseModel):
    order_id: str
    customer_name: str
    planned_arrival: str
    actual_arrival: str
    eta_deviation_minutes: float
    planned_distance_km: float
    actual_distance_km: float
    distance_deviation_km: float
    planned_cost: float
    actual_cost: float
    cost_deviation: float
    delivery_result: str


class PlanVsActualMetrics(BaseModel):
    deliveries_recorded: int
    avg_eta_deviation_minutes: float
    avg_distance_deviation_km: float
    avg_cost_deviation: float
    on_time_count: int
    late_count: int
    details: List[PlanVsActualItem] = Field(default_factory=list)
