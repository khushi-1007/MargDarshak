import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class StopStatus(str, enum.Enum):
    PENDING = "PENDING"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_id = Column(String(36), ForeignKey("routes.id"), nullable=False)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)  # Null if depot
    sequence = Column(Integer, nullable=False, default=0)
    
    # Times as "HH:MM" or ISO strings
    planned_arrival = Column(String(10), nullable=False)
    planned_departure = Column(String(10), nullable=False)
    actual_arrival = Column(String(10), nullable=True)
    actual_departure = Column(String(10), nullable=True)
    
    status = Column(Enum(StopStatus), default=StopStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    route = relationship("Route", back_populates="stops")
    order = relationship("Order", back_populates="route_stops")
