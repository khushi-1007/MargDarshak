import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    ON_ROUTE = "ON_ROUTE"
    BREAKDOWN = "BREAKDOWN"
    UNAVAILABLE = "UNAVAILABLE"
    OFFLINE = "OFFLINE"


class VehicleType(str, enum.Enum):
    THREE_WHEELER = "THREE_WHEELER"
    ELECTRIC_VAN = "ELECTRIC_VAN"
    LIGHT_COMMERCIAL = "LIGHT_COMMERCIAL"
    MEDIUM_TRUCK = "MEDIUM_TRUCK"
    HEAVY_TRUCK = "HEAVY_TRUCK"


class FuelType(str, enum.Enum):
    ELECTRIC = "ELECTRIC"
    CNG = "CNG"
    DIESEL = "DIESEL"
    PETROL = "PETROL"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.LIGHT_COMMERCIAL, nullable=False)
    capacity_kg = Column(Float, nullable=False, default=1000.0)
    current_load_kg = Column(Float, default=0.0, nullable=False)
    fuel_type = Column(Enum(FuelType), default=FuelType.DIESEL, nullable=False)
    
    # Financial & Cost parameters
    cost_per_km = Column(Float, default=12.0, nullable=False)           # Base vehicle wear & driver cost per km
    fuel_cost_per_km = Column(Float, default=8.0, nullable=False)      # Fuel/energy cost per km
    toll_factor = Column(Float, default=1.0, nullable=False)           # Toll multiplier based on vehicle class
    overtime_cost_per_minute = Column(Float, default=3.5, nullable=False) # Driver overtime rate
    
    driver_id = Column(String(36), ForeignKey("drivers.id"), nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False)
    
    # Coordinates & availability
    current_lat = Column(Float, nullable=False, default=26.9124)
    current_lng = Column(Float, nullable=False, default=75.7873)
    available_from = Column(String(10), default="08:00", nullable=False)   # HH:MM
    available_until = Column(String(10), default="20:00", nullable=False)  # HH:MM
    
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    driver = relationship("Driver", back_populates="vehicles")
    organization = relationship("Organization", back_populates="vehicles")
    routes = relationship("Route", back_populates="vehicle")
    orders = relationship("Order", back_populates="assigned_vehicle")
