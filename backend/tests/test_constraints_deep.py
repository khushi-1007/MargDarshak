import pytest
from app.models.driver import Driver, DriverStatus
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.vehicle import FuelType, Vehicle, VehicleStatus, VehicleType
from app.services.optimisation.solver import VRPTSolver


@pytest.mark.asyncio
async def test_capacity_constraint_split_assignment():
    """
    Capacity test:
    1 Vehicle with capacity = 100 kg.
    2 Orders: 60 kg and 50 kg (total = 110 kg > 100 kg).
    Solver must NOT assign both to the single vehicle.
    One must be unassigned or dropped.
    """
    vehicle = Vehicle(
        id="v_cap_1",
        vehicle_number="V-CAP-01",
        vehicle_type=VehicleType.LIGHT_COMMERCIAL,
        capacity_kg=100.0,
        cost_per_km=10.0,
        fuel_cost_per_km=5.0,
        status=VehicleStatus.AVAILABLE,
        available_from="08:00",
        available_until="18:00"
    )

    orders = [
        Order(
            id="ord_heavy_1",
            external_order_id="ORD-HVY-1",
            customer_name="Heavy Cust 1",
            customer_phone="9876543210",
            delivery_lat=26.9150,
            delivery_lng=75.7900,
            delivery_address="Jaipur",
            weight_kg=60.0,
            priority=OrderPriority.HIGH,
            window_start="09:00",
            window_end="15:00",
            service_duration_minutes=10,
            status=OrderStatus.PENDING
        ),
        Order(
            id="ord_heavy_2",
            external_order_id="ORD-HVY-2",
            customer_name="Heavy Cust 2",
            customer_phone="9876543210",
            delivery_lat=26.9200,
            delivery_lng=75.7950,
            delivery_address="Jaipur",
            weight_kg=50.0,
            priority=OrderPriority.NORMAL,
            window_start="09:00",
            window_end="15:00",
            service_duration_minutes=10,
            status=OrderStatus.PENDING
        )
    ]

    solver = VRPTSolver(vehicles=[vehicle], orders=orders, time_limit_seconds=5)
    res = await solver.solve()

    assert res["status"] in ["PARTIALLY_FEASIBLE", "FEASIBLE"]
    assigned_orders = []
    for r in res["routes"]:
        for s in r["stops"]:
            if s.get("order_id"):
                assigned_orders.append(s["order_id"])

    # Both cannot be on the single 100kg vehicle
    assert len(assigned_orders) <= 1
    assert len(res["unassigned_orders"]) >= 1


@pytest.mark.asyncio
async def test_driver_hours_constraint_enforced():
    """
    Driver hours test:
    Driver has only 0.5 hours (30 minutes) remaining.
    A route requiring multiple stops exceeding 30 minutes total travel + service
    must NOT be assigned to this driver.
    """
    driver_short = Driver(
        id="drv_short",
        name="Short Shift Driver",
        phone="9876543210",
        max_work_hours=0.5,
        hours_remaining=0.5,
        status=DriverStatus.AVAILABLE
    )
    vehicle = Vehicle(
        id="v_short_shift",
        vehicle_number="V-SHORT-01",
        vehicle_type=VehicleType.LIGHT_COMMERCIAL,
        capacity_kg=500.0,
        cost_per_km=10.0,
        fuel_cost_per_km=5.0,
        status=VehicleStatus.AVAILABLE,
        available_from="09:00",
        available_until="18:00",
        driver=driver_short
    )

    # 4 orders distributed across city requiring >= 60 minutes
    orders = [
        Order(
            id=f"ord_long_{i}",
            external_order_id=f"ORD-LONG-{i}",
            customer_name=f"Cust {i}",
            customer_phone="9876543210",
            delivery_lat=26.85 + (i * 0.05),
            delivery_lng=75.75 + (i * 0.05),
            delivery_address="Jaipur",
            weight_kg=10.0,
            priority=OrderPriority.NORMAL,
            window_start="09:00",
            window_end="18:00",
            service_duration_minutes=15,  # 15 mins service each
            status=OrderStatus.PENDING
        )
        for i in range(3)
    ]

    solver = VRPTSolver(vehicles=[vehicle], orders=orders, time_limit_seconds=5)
    res = await solver.solve()

    # The vehicle's route duration must not exceed 30 minutes
    for r in res["routes"]:
        assert r["total_duration_minutes"] <= 31.0


@pytest.mark.asyncio
async def test_priority_protection_under_scarcity():
    """
    Priority test:
    1 Vehicle (capacity 50kg).
    1 CRITICAL order (30kg) and 1 LOW order (30kg).
    Solver must prioritize the CRITICAL order over the LOW order.
    """
    vehicle = Vehicle(
        id="v_prio_1",
        vehicle_number="V-PRIO-01",
        vehicle_type=VehicleType.LIGHT_COMMERCIAL,
        capacity_kg=50.0,
        cost_per_km=10.0,
        fuel_cost_per_km=5.0,
        status=VehicleStatus.AVAILABLE,
        available_from="08:00",
        available_until="18:00"
    )

    crit_order = Order(
        id="ord_crit",
        external_order_id="ORD-CRIT-99",
        customer_name="Hospital ICU",
        customer_phone="9876543210",
        delivery_lat=26.9150,
        delivery_lng=75.7900,
        delivery_address="Jaipur",
        weight_kg=30.0,
        priority=OrderPriority.CRITICAL,
        window_start="09:00",
        window_end="12:00",
        service_duration_minutes=10,
        status=OrderStatus.PENDING
    )

    low_order = Order(
        id="ord_low",
        external_order_id="ORD-LOW-11",
        customer_name="Retail Shop",
        customer_phone="9876543210",
        delivery_lat=26.9150,
        delivery_lng=75.7900,
        delivery_address="Jaipur",
        weight_kg=30.0,
        priority=OrderPriority.LOW,
        window_start="09:00",
        window_end="12:00",
        service_duration_minutes=10,
        status=OrderStatus.PENDING
    )

    solver = VRPTSolver(vehicles=[vehicle], orders=[crit_order, low_order], time_limit_seconds=5)
    res = await solver.solve()

    assigned_orders = []
    for r in res["routes"]:
        for s in r["stops"]:
            if s.get("order_id"):
                assigned_orders.append(s["order_id"])

    assert "ord_crit" in assigned_orders
    assert "ord_low" in res["unassigned_orders"]
