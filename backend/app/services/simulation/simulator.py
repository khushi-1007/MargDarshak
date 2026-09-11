import copy
import uuid
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.models.order import Order, OrderPriority, OrderStatus
from app.models.route import Route, RouteStatus
from app.models.simulation import Simulation, SimulationScenarioType
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.schemas.simulation import (
    ScenarioComparisonResponse,
    SimulationDelta,
    SimulationMetrics,
    SimulationScenarioRequest,
)
from app.services.optimisation.solver import VRPTSolver


class WhatIfSimulator:
    """
    Non-destructive sandbox solver for evaluating 'what-if' operational scenarios
    without altering active production routes or database records.
    """

    def __init__(self, db: Session):
        self.db = db

    async def run_scenario(self, req: SimulationScenarioRequest) -> ScenarioComparisonResponse:
        # 1. Fetch current production baseline
        active_routes = self.db.query(Route).filter(
            Route.status.in_([RouteStatus.ACTIVE, RouteStatus.IN_PROGRESS])
        ).all()
        if not active_routes:
            active_routes = self.db.query(Route).filter(
                Route.status != RouteStatus.CANCELLED
            ).all()

        baseline_vehicles = self.db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.AVAILABLE, VehicleStatus.ASSIGNED, VehicleStatus.ON_ROUTE])
        ).all()
        baseline_orders = self.db.query(Order).filter(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.ASSIGNED, OrderStatus.DELAYED, OrderStatus.AT_RISK])
        ).all()

        current_metrics = self._compute_metrics(active_routes, baseline_orders, baseline_vehicles)

        # 2. Clone state in-memory (detached from SQLAlchemy session)
        sim_vehicles: List[Vehicle] = [self._clone_vehicle(v) for v in baseline_vehicles]
        sim_orders: List[Order] = [self._clone_order(o) for o in baseline_orders]

        traffic_multiplier = 1.0

        # 3. Apply what-if mutations (supports single or compound multi-vector scenarios)
        if req.removed_vehicle_id or req.scenario_type in [SimulationScenarioType.REMOVE_VEHICLE, SimulationScenarioType.VEHICLE_BREAKDOWN]:
            if req.removed_vehicle_id:
                sim_vehicles = [
                    v for v in sim_vehicles 
                    if v.id != req.removed_vehicle_id 
                    and v.vehicle_number != req.removed_vehicle_id
                    and req.removed_vehicle_id not in v.vehicle_number
                ]
            elif sim_vehicles:
                # Remove V04 or first vehicle
                v04 = [v for v in sim_vehicles if "4004" in v.vehicle_number or "6712" in v.vehicle_number]
                if v04:
                    sim_vehicles = [v for v in sim_vehicles if v != v04[0]]
                else:
                    sim_vehicles.pop(0)

        if req.new_vehicle_capacity_kg or req.scenario_type == SimulationScenarioType.ADD_VEHICLE:
            new_v = Vehicle(
                id=f"sim_v_{uuid.uuid4().hex[:6]}",
                vehicle_number=f"SIM-V{len(sim_vehicles)+1:02d}",
                vehicle_type=VehicleType.LIGHT_COMMERCIAL,
                capacity_kg=req.new_vehicle_capacity_kg or 1200.0,
                cost_per_km=12.0,
                fuel_cost_per_km=8.0,
                toll_factor=1.0,
                overtime_cost_per_minute=3.5,
                status=VehicleStatus.AVAILABLE,
                current_lat=26.9124,
                current_lng=75.7873,
                available_from="08:00",
                available_until="20:00"
            )
            sim_vehicles.append(new_v)

        if req.new_priority_order or req.scenario_type == SimulationScenarioType.ADD_PRIORITY_ORDER:
            if req.new_priority_order:
                po = Order(
                    id=f"sim_ord_{uuid.uuid4().hex[:6]}",
                    external_order_id=req.new_priority_order.external_order_id,
                    customer_name=req.new_priority_order.customer_name,
                    customer_phone=req.new_priority_order.customer_phone,
                    delivery_lat=req.new_priority_order.delivery_lat,
                    delivery_lng=req.new_priority_order.delivery_lng,
                    delivery_address=req.new_priority_order.delivery_address,
                    weight_kg=req.new_priority_order.weight_kg,
                    priority=req.new_priority_order.priority or OrderPriority.CRITICAL,
                    window_start=req.new_priority_order.window_start or "10:00",
                    window_end=req.new_priority_order.window_end or "12:00",
                    service_duration_minutes=getattr(req.new_priority_order, "service_duration_minutes", 15) or 15,
                    required_vehicle_type=getattr(req.new_priority_order, "required_vehicle_type", None),
                    status=OrderStatus.PENDING
                )
                sim_orders.append(po)

        if req.road_closure_lat or req.scenario_type == SimulationScenarioType.ROAD_CLOSURE:
            traffic_multiplier = 1.6  # Detours increase route durations

        if req.reduced_driver_hours or req.scenario_type == SimulationScenarioType.REDUCE_DRIVER_HOURS:
            reduced_limit = req.reduced_driver_hours or 4.0
            for v in sim_vehicles:
                if v.driver:
                    v.driver.max_work_hours = reduced_limit

        # 4. Solve the temporary simulation scenario with responsive 3s limit
        solver = VRPTSolver(
            vehicles=sim_vehicles,
            orders=sim_orders,
            traffic_factor=traffic_multiplier,
            allow_drops_with_penalty=True,
            time_limit_seconds=3,
        )
        sim_solution = await solver.solve()

        simulated_metrics = self._metrics_from_solver_solution(sim_solution, sim_orders, sim_vehicles)

        # 5. Calculate Differences
        delta = SimulationDelta(
            cost_delta=round(simulated_metrics.total_cost - current_metrics.total_cost, 2),
            distance_delta_km=round(simulated_metrics.total_distance_km - current_metrics.total_distance_km, 2),
            duration_delta_minutes=round(simulated_metrics.total_duration_minutes - current_metrics.total_duration_minutes, 1),
            sla_violations_delta=simulated_metrics.late_orders_count - current_metrics.late_orders_count,
            unassigned_orders_delta=simulated_metrics.unassigned_orders_count - current_metrics.unassigned_orders_count
        )

        # 6. Store Simulation audit record
        sim_record = Simulation(
            id=str(uuid.uuid4()),
            scenario_name=req.scenario_name,
            scenario_type=req.scenario_type,
            input_changes=req.model_dump(mode="json"),
            simulated_output={
                "current": current_metrics.model_dump(),
                "simulated": simulated_metrics.model_dump(),
                "delta": delta.model_dump()
            }
        )
        self.db.add(sim_record)
        self.db.commit()

        recommendations = sim_solution.get("recommendations", [])
        if delta.sla_violations_delta > 0:
            recommendations.append(f"Scenario results in {delta.sla_violations_delta} additional SLA violations.")
        if delta.cost_delta > 0:
            recommendations.append(f"Cost will increase by ₹{delta.cost_delta:.2f}.")

        return ScenarioComparisonResponse(
            scenario_name=req.scenario_name,
            scenario_type=req.scenario_type,
            current_plan=current_metrics,
            simulated_plan=simulated_metrics,
            difference=delta,
            recommendations=recommendations,
            simulated_routes_count=len(sim_solution.get("routes", []))
        )

    def _clone_vehicle(self, v: Vehicle) -> Vehicle:
        return Vehicle(
            id=v.id,
            vehicle_number=v.vehicle_number,
            vehicle_type=v.vehicle_type,
            capacity_kg=v.capacity_kg,
            current_load_kg=v.current_load_kg,
            fuel_type=v.fuel_type,
            cost_per_km=v.cost_per_km,
            fuel_cost_per_km=v.fuel_cost_per_km,
            toll_factor=v.toll_factor,
            overtime_cost_per_minute=v.overtime_cost_per_minute,
            status=v.status,
            current_lat=v.current_lat,
            current_lng=v.current_lng,
            available_from=v.available_from,
            available_until=v.available_until
        )

    def _clone_order(self, o: Order) -> Order:
        return Order(
            id=o.id,
            external_order_id=o.external_order_id,
            customer_name=o.customer_name,
            customer_phone=o.customer_phone,
            delivery_lat=o.delivery_lat,
            delivery_lng=o.delivery_lng,
            delivery_address=o.delivery_address,
            weight_kg=o.weight_kg,
            priority=o.priority,
            window_start=o.window_start,
            window_end=o.window_end,
            service_duration_minutes=o.service_duration_minutes,
            required_vehicle_type=o.required_vehicle_type,
            status=o.status
        )

    def _compute_metrics(self, routes: List[Route], orders: List[Order], vehicles: List[Vehicle]) -> SimulationMetrics:
        tot_cost = sum(r.total_cost for r in routes)
        tot_dist = sum(r.total_distance_km for r in routes)
        tot_dur = sum(r.total_duration_minutes for r in routes)
        
        assigned_ids = set()
        for r in routes:
            for s in r.stops:
                if s.order_id:
                    assigned_ids.add(s.order_id)
        unassigned_count = sum(1 for o in orders if o.id not in assigned_ids)
        
        total_capacity = sum(v.capacity_kg for v in vehicles) or 1.0
        used_weight = sum(o.weight_kg for o in orders if o.id in assigned_ids)
        utilisation = round((used_weight / total_capacity) * 100.0, 1)

        return SimulationMetrics(
            total_cost=round(tot_cost, 2),
            total_distance_km=round(tot_dist, 2),
            total_duration_minutes=round(tot_dur, 1),
            late_orders_count=0,
            unassigned_orders_count=unassigned_count,
            fleet_utilisation_pct=utilisation,
            active_vehicles_count=len(routes)
        )

    def _metrics_from_solver_solution(self, solution: Dict[str, Any], orders: List[Order], vehicles: List[Vehicle]) -> SimulationMetrics:
        unassigned_count = len(solution.get("unassigned_orders", []))
        total_capacity = sum(v.capacity_kg for v in vehicles) or 1.0
        used_weight = sum(o.weight_kg for o in orders if o.id not in solution.get("unassigned_orders", []))
        utilisation = round((used_weight / total_capacity) * 100.0, 1)

        return SimulationMetrics(
            total_cost=solution.get("total_cost", 0.0),
            total_distance_km=solution.get("total_distance_km", 0.0),
            total_duration_minutes=solution.get("total_duration_minutes", 0.0),
            late_orders_count=solution.get("late_orders_count", 0),
            unassigned_orders_count=unassigned_count,
            fleet_utilisation_pct=utilisation,
            active_vehicles_count=len(solution.get("routes", []))
        )
