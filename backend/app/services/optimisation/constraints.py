from typing import Dict, List, Optional, Set
from app.models.vehicle import Vehicle, VehicleType
from app.models.order import Order, OrderPriority
from app.utils.time import parse_time_to_minutes


def is_vehicle_eligible_for_order(vehicle: Vehicle, order: Order) -> bool:
    """Check if a vehicle meets the order's vehicle type and capacity requirements."""
    if order.required_vehicle_type is not None:
        if vehicle.vehicle_type != order.required_vehicle_type:
            return False
    if vehicle.capacity_kg < order.weight_kg:
        return False
    return True


def build_eligibility_map(vehicles: List[Vehicle], orders: List[Order]) -> Dict[str, Set[str]]:
    """
    Returns map of order_id -> set of eligible vehicle_ids.
    """
    eligibility = {}
    for order in orders:
        eligible_v_ids = set()
        for v in vehicles:
            if is_vehicle_eligible_for_order(v, order):
                eligible_v_ids.add(v.id)
        eligibility[order.id] = eligible_v_ids
    return eligibility


def compute_order_time_windows(orders: List[Order]) -> List[tuple]:
    """Convert order window strings to (start_minutes, end_minutes)."""
    windows = []
    for o in orders:
        start_m = parse_time_to_minutes(o.window_start)
        end_m = parse_time_to_minutes(o.window_end)
        windows.append((start_m, end_m))
    return windows
