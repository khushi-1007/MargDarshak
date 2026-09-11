import csv
import io
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.user import User, UserRole
from app.models.vehicle import VehicleType
from app.schemas.common import ApiResponse
from app.schemas.orders import OrderCreate, OrderImportResult, OrderResponse, OrderUpdate
from app.utils.geo import validate_coordinates
from app.utils.time import parse_time_to_minutes

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=ApiResponse[OrderResponse])
def create_order(
    req: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    if not validate_coordinates(req.delivery_lat, req.delivery_lng):
        raise HTTPException(status_code=400, detail="Invalid delivery coordinates.")

    existing = db.query(Order).filter(Order.external_order_id == req.external_order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Order with ID '{req.external_order_id}' already exists.")

    order = Order(
        id=str(uuid.uuid4()),
        external_order_id=req.external_order_id,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        pickup_address=req.pickup_address,
        delivery_lat=req.delivery_lat,
        delivery_lng=req.delivery_lng,
        delivery_address=req.delivery_address,
        weight_kg=req.weight_kg,
        priority=req.priority,
        window_start=req.window_start,
        window_end=req.window_end,
        service_duration_minutes=req.service_duration_minutes,
        required_vehicle_type=req.required_vehicle_type,
        status=OrderStatus.PENDING,
        organization_id=req.organization_id or current_user.organization_id
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return ApiResponse.ok(OrderResponse.model_validate(order))


@router.get("", response_model=ApiResponse[List[OrderResponse]])
def list_orders(
    status: Optional[OrderStatus] = None,
    priority: Optional[OrderPriority] = None,
    vehicle_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if priority:
        query = query.filter(Order.priority == priority)
    if vehicle_id:
        query = query.filter(Order.assigned_vehicle_id == vehicle_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Order.customer_name.ilike(s)) |
            (Order.external_order_id.ilike(s)) |
            (Order.delivery_address.ilike(s))
        )

    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    return ApiResponse.ok([OrderResponse.model_validate(o) for o in orders], meta={"total": query.count()})


@router.get("/{order_id}", response_model=ApiResponse[OrderResponse])
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return ApiResponse.ok(OrderResponse.model_validate(order))


VALID_ORDER_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.ASSIGNED, OrderStatus.CANCELLED, OrderStatus.DELAYED, OrderStatus.AT_RISK},
    OrderStatus.ASSIGNED: {OrderStatus.IN_TRANSIT, OrderStatus.PENDING, OrderStatus.CANCELLED, OrderStatus.DELAYED, OrderStatus.AT_RISK},
    OrderStatus.IN_TRANSIT: {OrderStatus.DELIVERED, OrderStatus.DELAYED, OrderStatus.AT_RISK, OrderStatus.ASSIGNED},
    OrderStatus.DELAYED: {OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED},
    OrderStatus.AT_RISK: {OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


@router.patch("/{order_id}", response_model=ApiResponse[OrderResponse])
def update_order(
    order_id: str,
    req: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    update_data = req.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != order.status:
        new_status = update_data["status"]
        allowed = VALID_ORDER_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            from app.core.exceptions import InvalidStateTransitionError
            raise InvalidStateTransitionError(f"Cannot transition order from {order.status.value} to {new_status.value}")

    new_start = update_data.get("window_start", order.window_start)
    new_end = update_data.get("window_end", order.window_end)
    if parse_time_to_minutes(new_start) >= parse_time_to_minutes(new_end):
        raise HTTPException(status_code=400, detail=f"window_start ({new_start}) must be earlier than window_end ({new_end})")

    for key, value in update_data.items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return ApiResponse.ok(OrderResponse.model_validate(order))


@router.delete("/{order_id}", response_model=ApiResponse[dict])
def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    db.delete(order)
    db.commit()
    return ApiResponse.ok({"message": f"Order {order_id} deleted successfully."})


@router.post("/import", response_model=ApiResponse[OrderImportResult])
@router.post("/import-csv", response_model=ApiResponse[OrderImportResult])
async def import_orders_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Malformed or non-UTF8 CSV file: {e}")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="Malformed CSV: missing header row.")

    required_hints = {"external_order_id", "order_id", "delivery_lat", "lat", "customer_name"}
    found_headers = {f.strip().lower() for f in reader.fieldnames}
    if not (required_hints & found_headers):
        raise HTTPException(
            status_code=400,
            detail="Malformed CSV: missing required order header columns (e.g. external_order_id, delivery_lat, customer_name)."
        )

    imported_count = 0
    failed_rows = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        try:
            ext_id = row.get("external_order_id") or row.get("order_id")
            if not ext_id:
                raise ValueError("Missing external_order_id")

            lat_val = row.get("delivery_lat") or row.get("lat")
            lng_val = row.get("delivery_lng") or row.get("lng")
            if lat_val is None or lng_val is None or lat_val.strip() == "" or lng_val.strip() == "":
                raise ValueError("Missing delivery coordinates")

            lat = float(lat_val)
            lng = float(lng_val)
            if not validate_coordinates(lat, lng):
                raise ValueError(f"Invalid coordinates: ({lat}, {lng})")

            weight = float(row.get("weight_kg", 10.0))
            if weight <= 0:
                raise ValueError("Weight must be greater than 0")

            priority_raw = row.get("priority", "NORMAL").strip().upper()
            try:
                priority = OrderPriority(priority_raw)
            except ValueError:
                raise ValueError(f"Invalid priority '{priority_raw}'. Allowed: {[p.value for p in OrderPriority]}")

            w_start = row.get("window_start", "09:00").strip()
            w_end = row.get("window_end", "18:00").strip()
            start_min = parse_time_to_minutes(w_start)
            end_min = parse_time_to_minutes(w_end)
            if start_min >= end_min:
                raise ValueError(f"Time window start ({w_start}) must be strictly earlier than end ({w_end})")

            req_v_type = None
            if row.get("required_vehicle_type") and row["required_vehicle_type"].strip():
                v_type_raw = row["required_vehicle_type"].strip().upper()
                try:
                    req_v_type = VehicleType(v_type_raw)
                except ValueError:
                    raise ValueError(f"Invalid required_vehicle_type '{v_type_raw}'. Allowed: {[v.value for v in VehicleType]}")

            existing = db.query(Order).filter(Order.external_order_id == ext_id).first()
            if existing:
                raise ValueError(f"Order ID '{ext_id}' already exists.")

            order = Order(
                id=str(uuid.uuid4()),
                external_order_id=ext_id,
                customer_name=row.get("customer_name", "Customer"),
                customer_phone=row.get("customer_phone", "9876543210"),
                pickup_lat=float(row.get("pickup_lat", 26.9124)),
                pickup_lng=float(row.get("pickup_lng", 75.7873)),
                pickup_address=row.get("pickup_address", "Jaipur Central Logistic Hub"),
                delivery_lat=lat,
                delivery_lng=lng,
                delivery_address=row.get("delivery_address", "Jaipur"),
                weight_kg=weight,
                priority=priority,
                window_start=w_start,
                window_end=w_end,
                service_duration_minutes=int(row.get("service_duration_minutes", 15)),
                required_vehicle_type=req_v_type,
                status=OrderStatus.PENDING,
                organization_id=current_user.organization_id
            )
            db.add(order)
            imported_count += 1
        except Exception as e:
            failed_rows += 1
            errors.append({"row": row_idx, "error": str(e)})

    db.commit()
    result = OrderImportResult(
        total_imported=imported_count,
        failed_rows=failed_rows,
        errors=errors
    )
    return ApiResponse.ok(result)
