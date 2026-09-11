from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.optimisation_run import OptimisationTriggerType, OptimisationRunStatus
from app.schemas.routes import RouteResponse


class CostWeights(BaseModel):
    distance_cost_factor: float = Field(default=1.0, ge=0.0)
    fuel_cost_factor: float = Field(default=1.0, ge=0.0)
    toll_cost_factor: float = Field(default=1.0, ge=0.0)
    overtime_cost_factor: float = Field(default=1.0, ge=0.0)
    lateness_penalty_factor: float = Field(default=1.0, ge=0.0)


class OptimisationRequest(BaseModel):
    order_ids: Optional[List[str]] = None
    vehicle_ids: Optional[List[str]] = None
    trigger_type: OptimisationTriggerType = OptimisationTriggerType.MANUAL
    time_limit_seconds: Optional[int] = 15
    traffic_factor: float = Field(default=1.0, ge=0.5, le=5.0)
    weather_factor: float = Field(default=1.0, ge=0.5, le=3.0)
    weights: CostWeights = Field(default_factory=CostWeights)
    allow_drops_with_penalty: bool = True


class SolverMeta(BaseModel):
    execution_time_ms: int
    orders_count: int
    vehicles_count: int
    objective_score: float
    feasible: bool
    status: OptimisationRunStatus
    infeasibility_reason: Optional[str] = None
    recommendations: List[str] = Field(default_factory=list)


class OptimisationResult(BaseModel):
    run_id: str
    trigger_type: OptimisationTriggerType
    status: OptimisationRunStatus
    total_distance_km: float
    total_duration_minutes: float
    total_cost: float
    late_orders_count: int
    routes: List[RouteResponse] = Field(default_factory=list)
    unassigned_order_ids: List[str] = Field(default_factory=list)
    solver_meta: SolverMeta
    created_at: datetime
