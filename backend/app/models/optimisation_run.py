import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class OptimisationTriggerType(str, enum.Enum):
    MANUAL = "MANUAL"
    SCHEDULED = "SCHEDULED"
    TRAFFIC = "TRAFFIC"
    WEATHER = "WEATHER"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    CASCADING_BREAKDOWN = "CASCADING_BREAKDOWN"
    PRIORITY_ORDER = "PRIORITY_ORDER"
    VEHICLE_UNAVAILABLE = "VEHICLE_UNAVAILABLE"


class OptimisationRunStatus(str, enum.Enum):
    STARTED = "STARTED"
    FEASIBLE = "FEASIBLE"
    PARTIALLY_FEASIBLE = "PARTIALLY_FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    FAILED = "FAILED"


class OptimisationRun(Base):
    __tablename__ = "optimisation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trigger_type = Column(Enum(OptimisationTriggerType), default=OptimisationTriggerType.MANUAL, nullable=False)
    status = Column(Enum(OptimisationRunStatus), default=OptimisationRunStatus.STARTED, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    
    orders_count = Column(Integer, default=0, nullable=False)
    vehicles_count = Column(Integer, default=0, nullable=False)
    total_distance = Column(Float, default=0.0, nullable=False)
    total_cost = Column(Float, default=0.0, nullable=False)
    late_orders = Column(Integer, default=0, nullable=False)
    feasible = Column(Boolean, default=True, nullable=False)
    infeasibility_reason = Column(String(500), nullable=True)
    
    previous_run_id = Column(String(36), ForeignKey("optimisation_runs.id"), nullable=True)
    run_metadata = Column(JSON, default=dict, nullable=False)

    # Relationships
    routes = relationship("Route", back_populates="optimisation_run", cascade="all, delete-orphan")
