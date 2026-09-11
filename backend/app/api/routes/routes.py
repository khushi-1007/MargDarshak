from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.delivery import DeliveryExecution
from app.models.order import Order, OrderStatus
from app.models.route import Route, RouteStatus
from app.models.route_stop import RouteStop, StopStatus
from app.models.route_version import RouteVersion
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.routes import RouteResponse, RouteStopResponse, RouteVersionResponse
from app.services.notifications.broadcaster import broadcaster
from app.utils.time import parse_time_to_minutes

router = APIRouter(prefix="/routes", tags=["Routes"])


class StopStatusUpdate(BaseModel):
    status: StopStatus
    actual_arrival: Optional[str] = None
    actual_departure: Optional[str] = None
    actual_distance_km: Optional[float] = None
    actual_cost: Optional[float] = None


@router.get("", response_model=ApiResponse[List[RouteResponse]])
def list_routes(
    status: Optional[RouteStatus] = None,
    optimisation_run_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Route)
    if status:
        query = query.filter(Route.status == status)
    if optimisation_run_id:
        query = query.filter(Route.optimisation_run_id == optimisation_run_id)

    routes = query.order_by(Route.updated_at.desc()).all()
    return ApiResponse.ok([RouteResponse.model_validate(r) for r in routes])


@router.get("/{route_id}", response_model=ApiResponse[RouteResponse])
def get_route(route_id: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found.")
    return ApiResponse.ok(RouteResponse.model_validate(route))


@router.get("/{route_id}/versions", response_model=ApiResponse[List[RouteVersionResponse]])
def get_route_versions(route_id: str, db: Session = Depends(get_db)):
    versions = db.query(RouteVersion).filter(RouteVersion.route_id == route_id).order_by(RouteVersion.version_number.desc()).all()
    return ApiResponse.ok([RouteVersionResponse.model_validate(v) for v in versions])


@router.patch("/stops/{stop_id}", response_model=ApiResponse[RouteStopResponse])
async def update_stop_status(
    stop_id: str,
    req: StopStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stop = db.query(RouteStop).filter(RouteStop.id == stop_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Route stop not found.")

    stop.status = req.status
    if req.actual_arrival:
        stop.actual_arrival = req.actual_arrival
    if req.actual_departure:
        stop.actual_departure = req.actual_departure

    # If completed, update order status and record DeliveryExecution (Plan vs Actual)
    if req.status == StopStatus.COMPLETED and stop.order_id:
        order = db.query(Order).filter(Order.id == stop.order_id).first()
        if order:
            order.status = OrderStatus.DELIVERED
            
            # Calculate plan vs actual deviations
            plan_arr_mins = parse_time_to_minutes(stop.planned_arrival)
            act_arr_mins = parse_time_to_minutes(req.actual_arrival or stop.planned_arrival)
            eta_deviation = act_arr_mins - plan_arr_mins

            planned_dist = 5.0
            actual_dist = req.actual_distance_km or 5.2
            planned_cost = 60.0
            actual_cost = req.actual_cost or 62.4

            delivery_result = "ON_TIME" if eta_deviation <= 5 else "LATE"

            exec_rec = DeliveryExecution(
                id=str(uuid.uuid4()),
                order_id=order.id,
                route_id=stop.route_id,
                planned_distance=planned_dist,
                actual_distance=actual_dist,
                planned_cost=planned_cost,
                actual_cost=actual_cost,
                planned_arrival=stop.planned_arrival,
                actual_arrival=req.actual_arrival or stop.planned_arrival,
                distance_deviation=round(actual_dist - planned_dist, 2),
                eta_deviation=float(eta_deviation),
                cost_deviation=round(actual_cost - planned_cost, 2),
                delivery_result=delivery_result
            )
            db.add(exec_rec)

            await broadcaster.broadcast("DELIVERY_STATUS_CHANGE", {
                "order_id": order.id,
                "customer_name": order.customer_name,
                "status": "DELIVERED",
                "delivery_result": delivery_result,
                "eta_deviation": eta_deviation
            })

    db.commit()
    db.refresh(stop)
    return ApiResponse.ok(RouteStopResponse.model_validate(stop))
