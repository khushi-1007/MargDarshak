from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RouteDecisionFacts(BaseModel):
    trigger: str = Field(..., description="Event trigger name e.g. VEHICLE_BREAKDOWN")
    vehicle_unavailable: Optional[str] = Field(None, description="Vehicle ID that broke down/unavailable")
    affected_orders: List[str] = Field(default_factory=list, description="List of order IDs affected")
    candidate_vehicles: List[str] = Field(default_factory=list, description="Available vehicles evaluated")
    selected_vehicle: Optional[str] = Field(None, description="Vehicle chosen to absorb reassignment")
    selection_reasons: List[str] = Field(default_factory=list, description="Deterministic reasons e.g. sufficient_capacity")
    cost_delta: float = Field(0.0, description="Cost change in currency")
    distance_delta_km: float = Field(0.0, description="Distance change in km")
    eta_delta_minutes: float = Field(0.0, description="ETA change in minutes")
    sla_violations_added: int = Field(0, description="Number of additional SLA breaches")
    trade_offs: List[str] = Field(default_factory=list, description="Explicit operational trade-offs made")
    unassigned_orders: List[str] = Field(default_factory=list, description="Orders that could not be feasibly assigned")


class GroundedExplanationRequest(BaseModel):
    question: Optional[str] = Field("Why was this routing decision made?", description="User query")
    facts: RouteDecisionFacts
    context_notes: Optional[str] = None


class GroundedExplanationResponse(BaseModel):
    explanation: str
    grounded_facts: RouteDecisionFacts
    engine: str = Field("MargDarshak Deterministic Explainer", description="Explainer engine used")
    confidence: float = 1.0
