import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.event import Event, EventSeverity, EventStatus, EventType
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.common import ApiResponse
from app.schemas.events import ImpactSummary
from app.schemas.vehicles import VehicleBreakdownRequest, VehicleCreate, VehicleResponse, VehicleUpdate
from app.services.events.processor import EventProcessor
from app.services.notifications.broadcaster import broadcaster

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


VALID_VEHICLE_TRANSITIONS = {
    VehicleStatus.AVAILABLE: {VehicleStatus.ASSIGNED, VehicleStatus.UNAVAILABLE, VehicleStatus.BREAKDOWN, VehicleStatus.AVAILABLE},
    VehicleStatus.ASSIGNED: {VehicleStatus.ON_ROUTE, VehicleStatus.AVAILABLE, VehicleStatus.BREAKDOWN, VehicleStatus.UNAVAILABLE, VehicleStatus.ASSIGNED},
    VehicleStatus.ON_ROUTE: {VehicleStatus.AVAILABLE, VehicleStatus.BREAKDOWN, VehicleStatus.UNAVAILABLE, VehicleStatus.ON_ROUTE},
    VehicleStatus.BREAKDOWN: {VehicleStatus.AVAILABLE, VehicleStatus.UNAVAILABLE, VehicleStatus.BREAKDOWN},
    VehicleStatus.UNAVAILABLE: {VehicleStatus.AVAILABLE, VehicleStatus.UNAVAILABLE},
}


@router.post("", response_model=ApiResponse[VehicleResponse])
def create_vehicle(
    req: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == req.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle number '{req.vehicle_number}' already exists.")

    vehicle = Vehicle(
        id=str(uuid.uuid4()),
        vehicle_number=req.vehicle_number,
        vehicle_type=req.vehicle_type,
        capacity_kg=req.capacity_kg,
        current_load_kg=req.current_load_kg,
        fuel_type=req.fuel_type,
        cost_per_km=req.cost_per_km,
        fuel_cost_per_km=req.fuel_cost_per_km,
        toll_factor=req.toll_factor,
        overtime_cost_per_minute=req.overtime_cost_per_minute,
        driver_id=req.driver_id,
        status=VehicleStatus.AVAILABLE,
        current_lat=req.current_lat,
        current_lng=req.current_lng,
        available_from=req.available_from,
        available_until=req.available_until,
        organization_id=req.organization_id or current_user.organization_id
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return ApiResponse.ok(VehicleResponse.model_validate(vehicle))


@router.get("", response_model=ApiResponse[List[VehicleResponse]])
def list_vehicles(
    status: Optional[VehicleStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status)
    vehicles = query.offset(offset).limit(limit).all()
    return ApiResponse.ok([VehicleResponse.model_validate(v) for v in vehicles], meta={"total": query.count()})


@router.get("/{vehicle_id}", response_model=ApiResponse[VehicleResponse])
def get_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return ApiResponse.ok(VehicleResponse.model_validate(vehicle))


@router.patch("/{vehicle_id}", response_model=ApiResponse[VehicleResponse])
def update_vehicle(
    vehicle_id: str,
    req: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if req.status is not None and req.status != vehicle.status:
        allowed = VALID_VEHICLE_TRANSITIONS.get(vehicle.status, set())
        if req.status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid vehicle status transition from {vehicle.status.value} to {req.status.value}."
            )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return ApiResponse.ok(VehicleResponse.model_validate(vehicle))


@router.post("/{vehicle_id}/breakdown", response_model=ApiResponse[ImpactSummary])
async def trigger_breakdown(
    vehicle_id: str,
    req: VehicleBreakdownRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    # 1. Create breakdown event
    event = Event(
        id=str(uuid.uuid4()),
        type=EventType.VEHICLE_BREAKDOWN,
        severity=EventSeverity.CRITICAL,
        title=f"Vehicle Breakdown: {vehicle.vehicle_number}",
        description=req.reason or f"Vehicle {vehicle.vehicle_number} broke down in transit.",
        location_lat=req.current_lat or vehicle.current_lat,
        location_lng=req.current_lng or vehicle.current_lng,
        vehicle_id=vehicle.id,
        status=EventStatus.ACTIVE,
        event_metadata={"reason": req.reason}
    )
    db.add(event)
    vehicle.status = VehicleStatus.BREAKDOWN
    db.commit()

    # 2. Process event and re-optimise
    processor = EventProcessor(db)
    result = await processor.process_event(event)

    # 3. Broadcast breakdown WebSocket event
    await broadcaster.broadcast("VEHICLE_BREAKDOWN", {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "reason": req.reason,
        "reassigned_orders": result["impact"]["orders_reassigned"]
    })

    return ApiResponse.ok(ImpactSummary(**result["impact"]))


@router.post("/{vehicle_id}/restore", response_model=ApiResponse[VehicleResponse])
def restore_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if vehicle.status not in (VehicleStatus.BREAKDOWN, VehicleStatus.UNAVAILABLE):
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle cannot be restored from status {vehicle.status.value}. Only BREAKDOWN or UNAVAILABLE vehicles can be restored."
        )

    vehicle.status = VehicleStatus.AVAILABLE
    db.commit()
    db.refresh(vehicle)
    return ApiResponse.ok(VehicleResponse.model_validate(vehicle))
