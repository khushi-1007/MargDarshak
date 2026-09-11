from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.analytics import (
    CostMetrics,
    OverviewMetrics,
    PlanVsActualMetrics,
    SLAMetrics,
    UtilisationMetrics,
)
from app.schemas.common import ApiResponse
from app.services.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=ApiResponse[OverviewMetrics])
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    svc = AnalyticsService(db)
    return ApiResponse.ok(svc.get_overview())


@router.get("/cost", response_model=ApiResponse[CostMetrics])
def get_cost_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    svc = AnalyticsService(db)
    return ApiResponse.ok(svc.get_cost_breakdown())


@router.get("/sla", response_model=ApiResponse[SLAMetrics])
def get_sla_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    svc = AnalyticsService(db)
    return ApiResponse.ok(svc.get_sla_metrics())


@router.get("/utilisation", response_model=ApiResponse[UtilisationMetrics])
def get_utilisation_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    svc = AnalyticsService(db)
    return ApiResponse.ok(svc.get_utilisation_metrics())


@router.get("/plan-vs-actual", response_model=ApiResponse[PlanVsActualMetrics])
def get_plan_vs_actual_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    svc = AnalyticsService(db)
    return ApiResponse.ok(svc.get_plan_vs_actual())
