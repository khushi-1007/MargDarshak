import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.event import Event, EventSeverity, EventStatus, EventType
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.common import ApiResponse
from app.schemas.events import EventCreate, EventResponse, EventSimulateRequest, ImpactSummary
from app.services.events.processor import EventProcessor
from app.services.notifications.broadcaster import broadcaster

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=ApiResponse[EventResponse])
async def create_event(
    req: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    event = Event(
        id=str(uuid.uuid4()),
        type=req.type,
        severity=req.severity,
        title=req.title,
        description=req.description,
        location_lat=req.location_lat,
        location_lng=req.location_lng,
        radius_km=req.radius_km,
        vehicle_id=req.vehicle_id,
        order_id=req.order_id,
        status=EventStatus.ACTIVE,
        event_metadata=req.metadata
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Broadcast notification
    await broadcaster.broadcast("EVENT_CREATED", {
        "event_id": event.id,
        "type": event.type.value,
        "title": event.title,
        "severity": event.severity.value
    })

    return ApiResponse.ok(EventResponse.model_validate(event))


@router.get("", response_model=ApiResponse[List[EventResponse]])
def list_events(
    status: Optional[EventStatus] = None,
    type: Optional[EventType] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if status:
        query = query.filter(Event.status == status)
    if type:
        query = query.filter(Event.type == type)

    events = query.order_by(Event.created_at.desc()).offset(offset).limit(limit).all()
    return ApiResponse.ok([EventResponse.model_validate(e) for e in events], meta={"total": query.count()})


@router.get("/weather/current")
async def get_current_weather(
    lat: float = Query(26.9124, description="Latitude"),
    lng: float = Query(75.7873, description="Longitude"),
    current_user: User = Depends(get_current_user)
):
    from app.services.weather.openweather_provider import OpenWeatherProvider
    provider = OpenWeatherProvider()
    data = await provider.get_current_weather(lat, lng)
    return ApiResponse.ok(data)


@router.get("/{event_id}", response_model=ApiResponse[EventResponse])
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return ApiResponse.ok(EventResponse.model_validate(event))


@router.post("/simulate", response_model=ApiResponse[ImpactSummary])
async def simulate_event(
    req: EventSimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    event_id = str(uuid.uuid4())
    event_meta = {"delay_factor": req.delay_factor or 1.5}

    # 1. Create and persist the operational event
    event = Event(
        id=event_id,
        type=req.type,
        severity=EventSeverity.HIGH,
        title=req.title or f"Simulated {req.type.value}",
        description=req.description or f"Operational condition change: {req.type.value}",
        location_lat=req.location_lat or 26.9124,
        location_lng=req.location_lng or 75.7873,
        radius_km=req.radius_km or 2.0,
        vehicle_id=req.vehicle_id,
        order_id=req.order_id,
        status=EventStatus.ACTIVE,
        event_metadata=event_meta
    )
    db.add(event)

    # 2. Apply specific mutations before re-optimising
    if req.type in [EventType.VEHICLE_BREAKDOWN, EventType.CASCADING_BREAKDOWN, EventType.VEHICLE_UNAVAILABLE]:
        if req.vehicle_id:
            v = db.query(Vehicle).filter(Vehicle.id == req.vehicle_id).first()
            if v:
                v.status = VehicleStatus.BREAKDOWN

    elif req.type == EventType.PRIORITY_ORDER and req.new_order:
        new_ord = Order(
            id=str(uuid.uuid4()),
            external_order_id=req.new_order.external_order_id,
            customer_name=req.new_order.customer_name,
            customer_phone=req.new_order.customer_phone,
            delivery_lat=req.new_order.delivery_lat,
            delivery_lng=req.new_order.delivery_lng,
            delivery_address=req.new_order.delivery_address,
            weight_kg=req.new_order.weight_kg,
            priority=req.new_order.priority,
            window_start=req.new_order.window_start,
            window_end=req.new_order.window_end,
            service_duration_minutes=req.new_order.service_duration_minutes,
            status=OrderStatus.PENDING,
            organization_id=current_user.organization_id
        )
        db.add(new_ord)
        event.order_id = new_ord.id

    db.commit()

    # 3. Process the event and re-optimise fleet
    processor = EventProcessor(db)
    result = await processor.process_event(event)

    return ApiResponse.ok(ImpactSummary(**result["impact"]))
