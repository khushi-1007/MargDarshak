import pytest
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.services.optimisation.solver import VRPTSolver


@pytest.mark.asyncio
async def test_solver_feasibility_and_capacity():
    vehicles = [
        Vehicle(
            id="v1",
            vehicle_number="V01",
            vehicle_type=VehicleType.LIGHT_COMMERCIAL,
            capacity_kg=500.0,
            cost_per_km=10.0,
            fuel_cost_per_km=6.0,
            status=VehicleStatus.AVAILABLE,
            available_from="08:00",
            available_until="20:00"
        ),
        Vehicle(
            id="v2",
            vehicle_number="V02",
            vehicle_type=VehicleType.LIGHT_COMMERCIAL,
            capacity_kg=500.0,
            cost_per_km=10.0,
            fuel_cost_per_km=6.0,
            status=VehicleStatus.AVAILABLE,
            available_from="08:00",
            available_until="20:00"
        )
    ]

    orders = [
        Order(
            id=f"ord_{i}",
            external_order_id=f"ORD_{i}",
            customer_name=f"Customer {i}",
            customer_phone="9876543210",
            delivery_lat=26.90 + (i * 0.01),
            delivery_lng=75.78 + (i * 0.01),
            delivery_address=f"Jaipur Stop {i}",
            weight_kg=100.0,
            priority=OrderPriority.NORMAL,
            window_start="09:00",
            window_end="18:00",
            service_duration_minutes=10,
            status=OrderStatus.PENDING
        )
        for i in range(4)
    ]

    solver = VRPTSolver(vehicles=vehicles, orders=orders, time_limit_seconds=5)
    result = await solver.solve()

    assert result["feasible"] is True
    assert result["status"] == "FEASIBLE"
    assert len(result["routes"]) > 0
    assert result["total_distance_km"] > 0
    assert result["total_cost"] > 0
    assert len(result["unassigned_orders"]) == 0


@pytest.mark.asyncio
async def test_solver_no_vehicles_infeasible():
    orders = [
        Order(
            id="ord_1",
            external_order_id="ORD_1",
            customer_name="Customer 1",
            customer_phone="9876543210",
            delivery_lat=26.91,
            delivery_lng=75.78,
            delivery_address="Jaipur",
            weight_kg=50.0,
            priority=OrderPriority.CRITICAL,
            window_start="09:00",
            window_end="12:00",
            service_duration_minutes=15,
            status=OrderStatus.PENDING
        )
    ]

    solver = VRPTSolver(vehicles=[], orders=orders)
    result = await solver.solve()

    assert result["feasible"] is False
    assert result["status"] == "INFEASIBLE"
    assert "No active vehicles" in result["infeasibility_reason"]
    assert "ord_1" in result["unassigned_orders"]
