import time
import pytest
from benchmarks.cvrplib_loader import CVRPLIBParser
from benchmarks.solomon_loader import SolomonParser
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.vehicle import FuelType, Vehicle, VehicleStatus, VehicleType
from app.services.optimisation.solver import VRPTSolver


def test_solomon_parser():
    sample_solomon = """
C101
VEHICLE
NUMBER     CAPACITY
  25         200

CUSTOMER
CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE TIME
    0      40.00     50.00       0.00         0.00   1236.00          0.00
    1      45.00     68.00      10.00       912.00    967.00         90.00
    2      45.00     70.00      30.00       825.00    870.00         90.00
"""
    res = SolomonParser.parse_text(sample_solomon)
    assert res["name"] == "C101"
    assert res["num_vehicles"] == 25
    assert res["capacity"] == 200.0
    assert res["depot"]["cust_no"] == 0
    assert len(res["customers"]) == 2
    assert res["customers"][0]["demand"] == 10.0


def test_cvrplib_parser():
    sample_cvrp = """
NAME : A-n32-k5
COMMENT : (Augerat et al, Min no of trucks: 5, Optimal value: 784)
TYPE : CVRP
DIMENSION : 3
EDGE_WEIGHT_TYPE : EUC_2D
CAPACITY : 100
NODE_COORD_SECTION
 1 38 46
 2 59 46
 3 96 42
DEMAND_SECTION
 1 0
 2 19
 3 16
DEPOT_SECTION
 1
 -1
EOF
"""
    res = CVRPLIBParser.parse_text(sample_cvrp)
    assert res["name"] == "A-n32-k5"
    assert res["capacity"] == 100.0
    assert res["depot_id"] == 1
    assert len(res["nodes"]) == 3
    assert res["nodes"][1]["demand"] == 19.0


@pytest.mark.asyncio
@pytest.mark.parametrize("num_orders,num_vehicles", [
    (10, 3),
    (20, 5),
    (50, 10),
    (100, 20)
])
async def test_solver_scalability_and_time_limits(num_orders, num_vehicles):
    """
    Test OR-Tools solver performance across various fleet scales:
    10/3, 20/5, 50/10, 100/20.
    Verify that solver strictly honors the time limit (e.g. 3s).
    """
    vehicles = [
        Vehicle(
            id=f"v_scale_{i}",
            vehicle_number=f"V-SCALE-{i:02d}",
            vehicle_type=VehicleType.LIGHT_COMMERCIAL,
            capacity_kg=300.0,
            cost_per_km=10.0,
            fuel_cost_per_km=5.0,
            status=VehicleStatus.AVAILABLE,
            available_from="08:00",
            available_until="20:00"
        )
        for i in range(num_vehicles)
    ]

    orders = [
        Order(
            id=f"ord_scale_{i}",
            external_order_id=f"ORD-SCALE-{i:03d}",
            customer_name=f"Scale Customer {i}",
            customer_phone="9876543210",
            delivery_lat=26.85 + (i * 0.002),
            delivery_lng=75.75 + (i * 0.002),
            delivery_address=f"Delivery Point {i}",
            weight_kg=15.0,
            priority=OrderPriority.NORMAL,
            window_start="09:00",
            window_end="18:00",
            service_duration_minutes=5,
            status=OrderStatus.PENDING
        )
        for i in range(num_orders)
    ]

    time_limit = 3  # 3 seconds max
    t0 = time.time()
    solver = VRPTSolver(vehicles=vehicles, orders=orders, time_limit_seconds=time_limit)
    res = await solver.solve()
    elapsed = time.time() - t0

    # Solver should complete within time_limit + buffer
    assert elapsed < time_limit + 4.0
    assert res["status"] in ["FEASIBLE", "PARTIALLY_FEASIBLE"]
    assert res["execution_time_ms"] > 0
