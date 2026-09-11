from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.optimisation_run import OptimisationRun, OptimisationTriggerType
from app.models.route import Route
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.optimisation import OptimisationRequest, OptimisationResult, SolverMeta
from app.schemas.routes import RouteResponse
from app.services.optimisation.reoptimiser import DynamicReoptimiser

router = APIRouter(prefix="/optimisation", tags=["Optimisation"])


@router.post("/run", response_model=ApiResponse[OptimisationResult])
@router.post("/reoptimise", response_model=ApiResponse[OptimisationResult])
async def run_optimisation(
    req: OptimisationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    reoptimiser = DynamicReoptimiser(db)
    result = await reoptimiser.reoptimise_fleet(
        trigger_type=req.trigger_type,
        traffic_factor=req.traffic_factor,
        weather_factor=req.weather_factor,
        time_limit_seconds=req.time_limit_seconds or 15,
        target_order_ids=req.order_ids,
        target_vehicle_ids=req.vehicle_ids
    )

    run = result["run"]
    solution = result["solution"]
    routes = result["routes"]

    meta = SolverMeta(
        execution_time_ms=solution["execution_time_ms"],
        orders_count=run.orders_count,
        vehicles_count=run.vehicles_count,
        objective_score=solution.get("objective_score", 0.0),
        feasible=solution["feasible"],
        status=run.status,
        infeasibility_reason=solution.get("infeasibility_reason"),
        recommendations=solution.get("recommendations", [])
    )

    opt_result = OptimisationResult(
        run_id=run.id,
        trigger_type=run.trigger_type,
        status=run.status,
        total_distance_km=solution["total_distance_km"],
        total_duration_minutes=solution["total_duration_minutes"],
        total_cost=solution["total_cost"],
        late_orders_count=solution["late_orders_count"],
        routes=[RouteResponse.model_validate(r) for r in routes],
        unassigned_order_ids=solution.get("unassigned_orders", []),
        solver_meta=meta,
        created_at=run.started_at
    )
    return ApiResponse.ok(opt_result)


@router.get("/runs", response_model=ApiResponse[List[dict]])
def list_optimisation_runs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    runs = db.query(OptimisationRun).order_by(OptimisationRun.started_at.desc()).offset(offset).limit(limit).all()
    out = []
    for r in runs:
        out.append({
            "id": r.id,
            "trigger_type": r.trigger_type.value,
            "status": r.status.value,
            "started_at": r.started_at,
            "completed_at": r.completed_at,
            "execution_time_ms": r.execution_time_ms,
            "orders_count": r.orders_count,
            "vehicles_count": r.vehicles_count,
            "total_distance": r.total_distance,
            "total_cost": r.total_cost,
            "late_orders": r.late_orders,
            "feasible": r.feasible,
            "infeasibility_reason": r.infeasibility_reason
        })
    return ApiResponse.ok(out, meta={"total": db.query(OptimisationRun).count()})


@router.get("/runs/{run_id}", response_model=ApiResponse[dict])
def get_optimisation_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(OptimisationRun).filter(OptimisationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Optimisation run not found.")

    routes = db.query(Route).filter(Route.optimisation_run_id == run.id).all()
    return ApiResponse.ok({
        "id": run.id,
        "trigger_type": run.trigger_type.value,
        "status": run.status.value,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "execution_time_ms": run.execution_time_ms,
        "orders_count": run.orders_count,
        "vehicles_count": run.vehicles_count,
        "total_distance": run.total_distance,
        "total_cost": run.total_cost,
        "late_orders": run.late_orders,
        "feasible": run.feasible,
        "infeasibility_reason": run.infeasibility_reason,
        "routes": [RouteResponse.model_validate(r) for r in routes]
    })
