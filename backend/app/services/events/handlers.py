from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.models.event import Event, EventType, EventSeverity, EventStatus
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.optimisation_run import OptimisationTriggerType
from app.models.vehicle import Vehicle, VehicleStatus
from app.services.optimisation.reoptimiser import DynamicReoptimiser


class EventHandler:
    """Base event handler interface."""
    def __init__(self, db: Session):
        self.db = db
        self.reoptimiser = DynamicReoptimiser(db)

    async def handle(self, event: Event) -> Dict[str, Any]:
        raise NotImplementedError


class BreakdownHandler(EventHandler):
    """
    Handles single breakdown and cascading failure breakdowns:
    1. Marks vehicle as BREAKDOWN / UNAVAILABLE.
    2. Re-optimises current active orders across remaining fleet.
    """
    async def handle(self, event: Event) -> Dict[str, Any]:
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == event.vehicle_id).first()
        if vehicle:
            vehicle.status = VehicleStatus.BREAKDOWN
            self.db.commit()

        trigger = (
            OptimisationTriggerType.CASCADING_BREAKDOWN
            if event.type == EventType.CASCADING_BREAKDOWN
            else OptimisationTriggerType.VEHICLE_BREAKDOWN
        )

        return await self.reoptimiser.reoptimise_fleet(
            trigger_type=trigger,
            event=event
        )


class TrafficHandler(EventHandler):
    """
    Handles traffic congestion:
    Applies traffic slowdown factor to route duration matrix.
    """
    async def handle(self, event: Event) -> Dict[str, Any]:
        traffic_factor = event.event_metadata.get("delay_factor", 1.5)
        return await self.reoptimiser.reoptimise_fleet(
            trigger_type=OptimisationTriggerType.TRAFFIC,
            event=event,
            traffic_factor=traffic_factor
        )


class WeatherHandler(EventHandler):
    """
    Handles severe weather (e.g. Heavy rain):
    Adjusts travel speed and transit risks using live weather or event metadata.
    """
    async def handle(self, event: Event) -> Dict[str, Any]:
        weather_factor = None
        if event.event_metadata and "delay_factor" in event.event_metadata:
            weather_factor = float(event.event_metadata["delay_factor"])
        else:
            try:
                from app.config import settings
                from app.services.weather.openweather_provider import OpenWeatherProvider
                provider = OpenWeatherProvider()
                lat = event.location_lat or settings.DEFAULT_DEPOT_LAT
                lng = event.location_lng or settings.DEFAULT_DEPOT_LNG
                weather_data = await provider.get_current_weather(lat, lng)
                weather_factor = weather_data.get("weather_delay_factor", 1.4)
            except Exception:
                weather_factor = 1.4

        return await self.reoptimiser.reoptimise_fleet(
            trigger_type=OptimisationTriggerType.WEATHER,
            event=event,
            weather_factor=weather_factor
        )


class PriorityOrderHandler(EventHandler):
    """
    Handles emergency / new priority order arrival:
    Inserts order and re-optimises immediately to find optimal insertion slot.
    """
    async def handle(self, event: Event) -> Dict[str, Any]:
        return await self.reoptimiser.reoptimise_fleet(
            trigger_type=OptimisationTriggerType.PRIORITY_ORDER,
            event=event
        )


class RoadClosureHandler(EventHandler):
    """
    Handles road closure events.
    """
    async def handle(self, event: Event) -> Dict[str, Any]:
        # Road closure induces localized detour delay
        return await self.reoptimiser.reoptimise_fleet(
            trigger_type=OptimisationTriggerType.ROAD_CLOSURE,
            event=event,
            traffic_factor=1.6
        )
