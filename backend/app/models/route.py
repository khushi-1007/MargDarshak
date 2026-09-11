import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class RouteStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    SUPERSEDED = "SUPERSEDED"


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    optimisation_run_id = Column(String(36), ForeignKey("optimisation_runs.id"), nullable=False)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    
    total_distance_km = Column(Float, default=0.0, nullable=False)
    total_duration_minutes = Column(Float, default=0.0, nullable=False)
    total_cost = Column(Float, default=0.0, nullable=False)
    expected_fuel_cost = Column(Float, default=0.0, nullable=False)
    expected_toll_cost = Column(Float, default=0.0, nullable=False)
    expected_overtime_cost = Column(Float, default=0.0, nullable=False)
    late_delivery_penalty = Column(Float, default=0.0, nullable=False)
    
    status = Column(Enum(RouteStatus), default=RouteStatus.ACTIVE, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    optimisation_run = relationship("OptimisationRun", back_populates="routes")
    vehicle = relationship("Vehicle", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.sequence")
    versions = relationship("RouteVersion", back_populates="route", cascade="all, delete-orphan")
