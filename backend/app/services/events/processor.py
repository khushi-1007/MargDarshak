from typing import Any, Dict
from sqlalchemy.orm import Session

from app.models.event import Event, EventType
from app.services.events.handlers import (
    BreakdownHandler,
    TrafficHandler,
    WeatherHandler,
    PriorityOrderHandler,
    RoadClosureHandler,
)


class EventProcessor:
    """Dispatches operational events to dedicated handlers."""

    def __init__(self, db: Session):
        self.db = db

    async def process_event(self, event: Event) -> Dict[str, Any]:
        if event.type in [EventType.VEHICLE_BREAKDOWN, EventType.CASCADING_BREAKDOWN, EventType.VEHICLE_UNAVAILABLE]:
            handler = BreakdownHandler(self.db)
        elif event.type == EventType.TRAFFIC:
            handler = TrafficHandler(self.db)
        elif event.type == EventType.WEATHER:
            handler = WeatherHandler(self.db)
        elif event.type == EventType.PRIORITY_ORDER:
            handler = PriorityOrderHandler(self.db)
        elif event.type == EventType.ROAD_CLOSURE:
            handler = RoadClosureHandler(self.db)
        else:
            handler = TrafficHandler(self.db)

        return await handler.handle(event)
