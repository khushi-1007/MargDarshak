from typing import Dict, Optional
from app.models.order import OrderPriority

# Multipliers for priority-based SLA penalties
PRIORITY_LATENESS_PENALTY_PER_MINUTE: Dict[OrderPriority, float] = {
    OrderPriority.CRITICAL: 1000.0,
    OrderPriority.HIGH: 250.0,
    OrderPriority.NORMAL: 50.0,
    OrderPriority.LOW: 10.0,
}

# Massive penalties for dropping unserved orders based on priority
PRIORITY_DROP_PENALTIES: Dict[OrderPriority, int] = {
    OrderPriority.CRITICAL: 10_000_000,
    OrderPriority.HIGH: 2_500_000,
    OrderPriority.NORMAL: 500_000,
    OrderPriority.LOW: 100_000,
}


def compute_route_costs(
    distance_km: float,
    duration_minutes: float,
    cost_per_km: Optional[float] = 12.0,
    fuel_cost_per_km: Optional[float] = 8.0,
    toll_factor: Optional[float] = 1.0,
    overtime_cost_per_minute: Optional[float] = 3.5,
    driver_max_regular_minutes: float = 480.0,  # 8 hours standard shift
    late_delivery_penalty: float = 0.0,
    toll_base_rate: float = 1.2,
) -> Dict[str, float]:
    """
    Calculate detailed cost breakdown for a route with robust None fallbacks.
    """
    c_km = 12.0 if cost_per_km is None else float(cost_per_km)
    f_km = 8.0 if fuel_cost_per_km is None else float(fuel_cost_per_km)
    t_factor = 1.0 if toll_factor is None else float(toll_factor)
    ot_rate = 3.5 if overtime_cost_per_minute is None else float(overtime_cost_per_minute)

    base_dist_cost = round(distance_km * c_km, 2)
    fuel_cost = round(distance_km * f_km, 2)
    toll_cost = round(distance_km * toll_base_rate * t_factor, 2)
    
    overtime_minutes = max(0.0, duration_minutes - driver_max_regular_minutes)
    overtime_cost = round(overtime_minutes * ot_rate, 2)
    
    total_cost = round(base_dist_cost + fuel_cost + toll_cost + overtime_cost + late_delivery_penalty, 2)
    
    return {
        "base_distance_cost": base_dist_cost,
        "fuel_cost": fuel_cost,
        "toll_cost": toll_cost,
        "overtime_cost": overtime_cost,
        "late_delivery_penalty": round(late_delivery_penalty, 2),
        "total_cost": total_cost,
    }
