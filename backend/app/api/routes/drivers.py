import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.driver import Driver, DriverStatus
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.drivers import DriverCreate, DriverResponse, DriverUpdate

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.post("", response_model=ApiResponse[DriverResponse])
def create_driver(
    req: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    driver = Driver(
        id=str(uuid.uuid4()),
        name=req.name,
        phone=req.phone,
        max_work_hours=req.max_work_hours,
        hours_remaining=req.hours_remaining,
        status=req.status,
        current_lat=req.current_lat,
        current_lng=req.current_lng,
        organization_id=req.organization_id or current_user.organization_id
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return ApiResponse.ok(DriverResponse.model_validate(driver))


@router.get("", response_model=ApiResponse[List[DriverResponse]])
def list_drivers(
    status: Optional[DriverStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Driver)
    if status:
        query = query.filter(Driver.status == status)
    drivers = query.offset(offset).limit(limit).all()
    return ApiResponse.ok([DriverResponse.model_validate(d) for d in drivers], meta={"total": query.count()})


@router.get("/{driver_id}", response_model=ApiResponse[DriverResponse])
def get_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")
    return ApiResponse.ok(DriverResponse.model_validate(driver))


@router.patch("/{driver_id}", response_model=ApiResponse[DriverResponse])
def update_driver(
    driver_id: str,
    req: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return ApiResponse.ok(DriverResponse.model_validate(driver))
