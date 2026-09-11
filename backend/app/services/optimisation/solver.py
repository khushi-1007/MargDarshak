import time
from typing import Any, Dict, List, Optional, Tuple
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.core.logging import logger
from app.models.order import Order, OrderPriority
from app.models.vehicle import Vehicle
from app.services.optimisation.constraints import is_vehicle_eligible_for_order
from app.services.optimisation.objective import PRIORITY_DROP_PENALTIES, PRIORITY_LATENESS_PENALTY_PER_MINUTE, compute_route_costs
from app.services.routing.matrix import get_cached_distance_and_duration_matrices
from app.utils.time import parse_time_to_minutes, minutes_to_time_str


class VRPTSolver:
    """
    Production-grade Multi-Vehicle Routing Problem with Time Windows & Capacities (CVRPTW)
    implemented with Google OR-Tools.
    """

    def __init__(
        self,
        vehicles: List[Vehicle],
        orders: List[Order],
        depot_coords: Tuple[float, float] = (26.9124, 75.7873),
        time_limit_seconds: int = 15,
        traffic_factor: float = 1.0,
        weather_factor: float = 1.0,
        allow_drops_with_penalty: bool = True
    ):
        self.vehicles = vehicles
        self.orders = orders
        self.depot_coords = depot_coords
        self.time_limit_seconds = time_limit_seconds
        self.traffic_factor = traffic_factor
        self.weather_factor = weather_factor
        self.allow_drops_with_penalty = allow_drops_with_penalty

    async def solve(self) -> Dict[str, Any]:
        start_exec_time = time.time()
        
        if not self.vehicles:
            return {
                "feasible": False,
                "status": "INFEASIBLE",
                "execution_time_ms": int((time.time() - start_exec_time) * 1000),
                "infeasibility_reason": "No active vehicles available in fleet.",
                "routes": [],
                "unassigned_orders": [o.id for o in self.orders],
                "total_distance_km": 0.0,
                "total_duration_minutes": 0.0,
                "total_cost": 0.0,
                "late_orders_count": 0,
                "recommendations": ["Activate standby vehicles", "Contract third-party carriers"]
            }

        if not self.orders:
            return {
                "feasible": True,
                "status": "FEASIBLE",
                "execution_time_ms": int((time.time() - start_exec_time) * 1000),
                "infeasibility_reason": None,
                "routes": [],
                "unassigned_orders": [],
                "total_distance_km": 0.0,
                "total_duration_minutes": 0.0,
                "total_cost": 0.0,
                "late_orders_count": 0,
                "recommendations": []
            }

        # Node 0 is Depot. Nodes 1..N are Orders.
        locations: List[Tuple[float, float]] = [self.depot_coords]
        for o in self.orders:
            locations.append((o.delivery_lat, o.delivery_lng))

        dist_matrix_km, dur_matrix_mins = await get_cached_distance_and_duration_matrices(
            locations,
            traffic_factor=self.traffic_factor * self.weather_factor
        )

        num_nodes = len(locations)
        num_vehicles = len(self.vehicles)
        depot_index = 0

        # OR-Tools Index Manager (all vehicles start and end at depot)
        starts = [depot_index] * num_vehicles
        ends = [depot_index] * num_vehicles
        manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, starts, ends)
        routing = pywrapcp.RoutingModel(manager)

        # 1. Distance & Objective Evaluation
        # Convert distances to meters (integer)
        dist_matrix_int = [
            [int(round(dist_matrix_km[i][j] * 1000)) for j in range(num_nodes)]
            for i in range(num_nodes)
        ]

        def distance_callback(from_index: int, to_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return dist_matrix_int[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # 2. Capacity Constraint (Demands)
        demands = [0] + [int(round(o.weight_kg)) for o in self.orders]
        def demand_callback(from_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            return demands[from_node]

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        vehicle_capacities = [int(round(v.capacity_kg)) for v in self.vehicles]
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            vehicle_capacities,
            True,  # start cumul to zero
            "Capacity"
        )

        # 3. Time Windows & Driver Hours
        # Service durations: depot = 0 mins, orders = service_duration_minutes (defensive fallback to 15)
        service_times = [0] + [(int(o.service_duration_minutes) if o.service_duration_minutes is not None else 15) for o in self.orders]
        dur_matrix_int = [
            [int(round(dur_matrix_mins[i][j])) + service_times[i] for j in range(num_nodes)]
            for i in range(num_nodes)
        ]

        def time_callback(from_index: int, to_index: int) -> int:
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return dur_matrix_int[from_node][to_node]

        time_callback_index = routing.RegisterTransitCallback(time_callback)
        
        # Max horizon in minutes (e.g. 1440 mins = 24h)
        routing.AddDimension(
            time_callback_index,
            120,    # allow waiting time / slack up to 120 minutes
            1440,   # max route time horizon
            False,  # don't force start to zero; start at vehicle available_from
            "Time"
        )
        time_dimension = routing.GetDimensionOrDie("Time")

        # Set Vehicle Start & End Time Limits (Driver availability & max work hours)
        for v_idx, vehicle in enumerate(self.vehicles):
            start_idx = routing.Start(v_idx)
            end_idx = routing.End(v_idx)
            
            avail_start = parse_time_to_minutes(vehicle.available_from)
            avail_end = parse_time_to_minutes(vehicle.available_until)
            time_dimension.CumulVar(start_idx).SetMin(avail_start)
            time_dimension.CumulVar(start_idx).SetMax(avail_end)
            time_dimension.CumulVar(end_idx).SetMax(avail_end)
            
            # Driver max work hours
            driver_hours = vehicle.driver.hours_remaining if (vehicle.driver and vehicle.driver.hours_remaining is not None) else (vehicle.driver.max_work_hours if vehicle.driver else 8.0)
            max_driver_mins = int(driver_hours * 60)
            routing.solver().Add(time_dimension.CumulVar(end_idx) - time_dimension.CumulVar(start_idx) <= max_driver_mins)
            routing.AddVariableMinimizedByFinalizer(time_dimension.CumulVar(end_idx))

        # Set Order Delivery Time Windows (Soft bounds with heavy priority penalties)
        for order_idx, order in enumerate(self.orders):
            node_idx = order_idx + 1
            solver_idx = manager.NodeToIndex(node_idx)
            
            w_start = parse_time_to_minutes(order.window_start)
            w_end = parse_time_to_minutes(order.window_end)
            
            # Order must not arrive before window_start
            time_dimension.CumulVar(solver_idx).SetMin(w_start)
            
            # Late delivery soft upper bound: penalty proportional to priority
            penalty_rate = int(PRIORITY_LATENESS_PENALTY_PER_MINUTE.get(order.priority, 50.0))
            time_dimension.SetCumulVarSoftUpperBound(solver_idx, w_end, penalty_rate)

        # 4. Vehicle Eligibility / Type Compatibility
        for order_idx, order in enumerate(self.orders):
            node_idx = order_idx + 1
            solver_idx = manager.NodeToIndex(node_idx)
            for v_idx, vehicle in enumerate(self.vehicles):
                if not is_vehicle_eligible_for_order(vehicle, order):
                    # Disallow vehicle for this order node
                    routing.VehicleVar(solver_idx).RemoveValue(v_idx)

        # 5. Priority-weighted Disjunctions (Dropping orders if impossible to serve)
        if self.allow_drops_with_penalty:
            for order_idx, order in enumerate(self.orders):
                node_idx = order_idx + 1
                solver_idx = manager.NodeToIndex(node_idx)
                drop_penalty = PRIORITY_DROP_PENALTIES.get(order.priority, 500_000)
                routing.AddDisjunction([solver_idx], drop_penalty)

        # Search Parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = max(2, self.time_limit_seconds)

        # Solve
        solution = routing.SolveWithParameters(search_parameters)
        execution_time_ms = int((time.time() - start_exec_time) * 1000)

        if not solution:
            return {
                "feasible": False,
                "status": "INFEASIBLE",
                "execution_time_ms": execution_time_ms,
                "infeasibility_reason": "Solver could not find any valid assignment within time/capacity constraints.",
                "routes": [],
                "unassigned_orders": [o.id for o in self.orders],
                "total_distance_km": 0.0,
                "total_duration_minutes": 0.0,
                "total_cost": 0.0,
                "late_orders_count": 0,
                "recommendations": [
                    "Relax delivery time windows for non-critical orders",
                    "Add additional vehicles to the fleet",
                    "Split bulk order weights"
                ]
            }

        # Process Solution
        route_results = []
        unassigned_orders: List[str] = []
        for order_idx, order in enumerate(self.orders):
            node_idx = order_idx + 1
            solver_idx = manager.NodeToIndex(node_idx)
            if solution.Value(routing.NextVar(solver_idx)) == solver_idx:
                unassigned_orders.append(order.id)

        total_distance_fleet = 0.0
        total_duration_fleet = 0.0
        total_cost_fleet = 0.0
        total_late_orders = 0

        for v_idx, vehicle in enumerate(self.vehicles):
            index = routing.Start(v_idx)
            route_nodes = []
            planned_stops = []
            seq = 0
            
            # Depot start stop
            depot_start_time = solution.Min(time_dimension.CumulVar(index))
            planned_stops.append({
                "sequence": seq,
                "order_id": None,
                "node_index": 0,
                "planned_arrival": minutes_to_time_str(depot_start_time),
                "planned_departure": minutes_to_time_str(depot_start_time),
                "status": "COMPLETED",
                "is_depot": True
            })

            route_dist_meters = 0
            late_penalty_vehicle = 0.0

            while not routing.IsEnd(index):
                prev_index = index
                index = solution.Value(routing.NextVar(index))
                node = manager.IndexToNode(index)
                
                if node != 0:
                    seq += 1
                    order_obj = self.orders[node - 1]
                    arr_min = solution.Min(time_dimension.CumulVar(index))
                    dep_min = arr_min + order_obj.service_duration_minutes
                    
                    # Check lateness
                    window_end_min = parse_time_to_minutes(order_obj.window_end)
                    if arr_min > window_end_min:
                        mins_late = arr_min - window_end_min
                        total_late_orders += 1
                        rate = PRIORITY_LATENESS_PENALTY_PER_MINUTE.get(order_obj.priority, 50.0)
                        late_penalty_vehicle += mins_late * rate

                    planned_stops.append({
                        "sequence": seq,
                        "order_id": order_obj.id,
                        "order": order_obj,
                        "node_index": node,
                        "planned_arrival": minutes_to_time_str(arr_min),
                        "planned_departure": minutes_to_time_str(dep_min),
                        "status": "PENDING",
                        "is_depot": False
                    })
                    route_nodes.append(node)

                route_dist_meters += routing.GetArcCostForVehicle(prev_index, index, v_idx)

            if route_nodes:
                depot_end_time = solution.Min(time_dimension.CumulVar(index))
                seq += 1
                planned_stops.append({
                    "sequence": seq,
                    "order_id": None,
                    "node_index": 0,
                    "planned_arrival": minutes_to_time_str(depot_end_time),
                    "planned_departure": minutes_to_time_str(depot_end_time),
                    "status": "PENDING",
                    "is_depot": True
                })

                v_distance_km = round(route_dist_meters / 1000.0, 2)
                v_duration_mins = round(depot_end_time - depot_start_time, 1)

                costs = compute_route_costs(
                    distance_km=v_distance_km,
                    duration_minutes=v_duration_mins,
                    cost_per_km=vehicle.cost_per_km,
                    fuel_cost_per_km=vehicle.fuel_cost_per_km,
                    toll_factor=vehicle.toll_factor,
                    overtime_cost_per_minute=vehicle.overtime_cost_per_minute,
                    late_delivery_penalty=late_penalty_vehicle
                )

                total_distance_fleet += v_distance_km
                total_duration_fleet += v_duration_mins
                total_cost_fleet += costs["total_cost"]

                route_results.append({
                    "vehicle_id": vehicle.id,
                    "vehicle_number": vehicle.vehicle_number,
                    "total_distance_km": v_distance_km,
                    "total_duration_minutes": v_duration_mins,
                    "total_cost": costs["total_cost"],
                    "expected_fuel_cost": costs["fuel_cost"],
                    "expected_toll_cost": costs["toll_cost"],
                    "expected_overtime_cost": costs["overtime_cost"],
                    "late_delivery_penalty": costs["late_delivery_penalty"],
                    "stops": planned_stops,
                    "orders_count": len(route_nodes)
                })

        is_partially_feasible = len(unassigned_orders) > 0
        overall_status = "PARTIALLY_FEASIBLE" if is_partially_feasible else "FEASIBLE"
        
        recommendations = []
        if is_partially_feasible:
            recommendations.append(f"{len(unassigned_orders)} lower-priority orders could not be accommodated within active vehicle limits.")
            recommendations.append("Deploy backup vehicle or request external courier for dropped orders.")

        return {
            "feasible": True,
            "status": overall_status,
            "execution_time_ms": execution_time_ms,
            "infeasibility_reason": None,
            "objective_score": round(solution.ObjectiveValue(), 2),
            "routes": route_results,
            "unassigned_orders": unassigned_orders,
            "total_distance_km": round(total_distance_fleet, 2),
            "total_duration_minutes": round(total_duration_fleet, 1),
            "total_cost": round(total_cost_fleet, 2),
            "late_orders_count": total_late_orders,
            "recommendations": recommendations
        }
