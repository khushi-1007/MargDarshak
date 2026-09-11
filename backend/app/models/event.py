import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Enum, JSON, ForeignKey
from app.db.base import Base


class EventType(str, enum.Enum):
    TRAFFIC = "TRAFFIC"
    WEATHER = "WEATHER"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    CASCADING_BREAKDOWN = "CASCADING_BREAKDOWN"
    PRIORITY_ORDER = "PRIORITY_ORDER"
    VEHICLE_UNAVAILABLE = "VEHICLE_UNAVAILABLE"
    OTHER = "OTHER"


class EventSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EventStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(Enum(EventType), nullable=False)
    severity = Column(Enum(EventSeverity), default=EventSeverity.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True, default=2.0)
    
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    affected_route_id = Column(String(36), ForeignKey("routes.id"), nullable=True)
    
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(EventStatus), default=EventStatus.ACTIVE, nullable=False)
    
    event_metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
