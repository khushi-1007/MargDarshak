import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum, JSON
from app.db.base import Base


class SimulationScenarioType(str, enum.Enum):
    REMOVE_VEHICLE = "REMOVE_VEHICLE"
    ADD_VEHICLE = "ADD_VEHICLE"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    ADD_PRIORITY_ORDER = "ADD_PRIORITY_ORDER"
    CHANGE_DELIVERY_WINDOW = "CHANGE_DELIVERY_WINDOW"
    REDUCE_DRIVER_HOURS = "REDUCE_DRIVER_HOURS"


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_name = Column(String(255), nullable=False)
    scenario_type = Column(Enum(SimulationScenarioType), nullable=False)
    
    # Input parameter changes (e.g. {"removed_vehicle_id": "V02", "delay_minutes": 30})
    input_changes = Column(JSON, default=dict, nullable=False)
    
    # Output metrics comparison snapshot
    simulated_output = Column(JSON, default=dict, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
