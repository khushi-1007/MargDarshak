import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.vehicle import VehicleType


class OrderPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"
    AT_RISK = "AT_RISK"


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    external_order_id = Column(String(100), unique=True, index=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    
    # Pickup location (defaults to Central Depot if not specified)
    pickup_lat = Column(Float, nullable=False, default=26.9124)
    pickup_lng = Column(Float, nullable=False, default=75.7873)
    pickup_address = Column(String(500), nullable=False, default="Jaipur Central Logistic Hub, Transport Nagar")
    
    # Delivery location
    delivery_lat = Column(Float, nullable=False)
    delivery_lng = Column(Float, nullable=False)
    delivery_address = Column(String(500), nullable=False)
    
    # Payload & Constraints
    weight_kg = Column(Float, nullable=False, default=10.0)
    priority = Column(Enum(OrderPriority), default=OrderPriority.NORMAL, nullable=False)
    window_start = Column(String(10), default="09:00", nullable=False)   # HH:MM
    window_end = Column(String(10), default="18:00", nullable=False)     # HH:MM
    service_duration_minutes = Column(Integer, default=15, nullable=False)
    required_vehicle_type = Column(Enum(VehicleType), nullable=True)     # None if any vehicle eligible
    
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    assigned_vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    assigned_vehicle = relationship("Vehicle", back_populates="orders")
    organization = relationship("Organization", back_populates="orders")
    route_stops = relationship("RouteStop", back_populates="order", cascade="all, delete-orphan")
    deliveries = relationship("DeliveryExecution", back_populates="order", cascade="all, delete-orphan")
