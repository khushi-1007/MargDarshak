import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class DeliveryExecution(Base):
    __tablename__ = "delivery_executions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    route_id = Column(String(36), ForeignKey("routes.id"), nullable=True)
    
    planned_distance = Column(Float, default=0.0, nullable=False)
    actual_distance = Column(Float, default=0.0, nullable=False)
    
    planned_cost = Column(Float, default=0.0, nullable=False)
    actual_cost = Column(Float, default=0.0, nullable=False)
    
    planned_arrival = Column(String(10), nullable=False)
    actual_arrival = Column(String(10), nullable=False)
    
    # Deviations (Actual - Planned)
    distance_deviation = Column(Float, default=0.0, nullable=False)
    eta_deviation = Column(Float, default=0.0, nullable=False)  # minutes
    cost_deviation = Column(Float, default=0.0, nullable=False)
    
    delivery_result = Column(String(50), default="ON_TIME", nullable=False)  # ON_TIME, LATE, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    order = relationship("Order", back_populates="deliveries")
