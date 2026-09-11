from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.event import Event, EventType, EventStatus
from app.models.optimisation_run import OptimisationRun, OptimisationRunStatus, OptimisationTriggerType
from app.models.order import Order, OrderPriority, OrderStatus
from app.models.route import Route, RouteStatus
from app.models.route_stop import RouteStop, StopStatus
from app.models.route_version import RouteVersion
from app.models.vehicle import Vehicle, VehicleStatus
from app.services.notifications.broadcaster import broadcaster
from app.services.optimisation.solver import VRPTSolver
from app.utils.time import parse_time_to_minutes


class DynamicReoptimiser:
    """
    Orchestrates dynamic re-optimisation, delta impact assessment,
    route versioning, and real-time WebSocket broadcasting.
    """

    def __init__(self, db: Session):
        self.db = db

    async def reoptimise_fleet(
        self,
        trigger_type: OptimisationTriggerType,
        event: Optional[Event] = None,
        traffic_factor: float = 1.0,
        weather_factor: float = 1.0,
        time_limit_seconds: int = 5,
        target_order_ids: Optional[List[str]] = None,
        target_vehicle_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Execute full dynamic re-optimisation on CURRENT fleet state.
        """
        # Check active environmental factors if factors are at default 1.0
        if traffic_factor == 1.0:
            active_traffic = self.db.query(Event).filter(
                Event.type == EventType.TRAFFIC,
                Event.status == EventStatus.ACTIVE
            ).order_by(Event.created_at.desc()).first()
            if active_traffic and active_traffic.event_metadata and "delay_factor" in active_traffic.event_metadata:
                traffic_factor = float(active_traffic.event_metadata["delay_factor"])

        if weather_factor == 1.0:
            active_weather = self.db.query(Event).filter(
                Event.type == EventType.WEATHER,
                Event.status == EventStatus.ACTIVE
            ).order_by(Event.created_at.desc()).first()
            if active_weather and active_weather.event_metadata and "delay_factor" in active_weather.event_metadata:
                weather_factor = float(active_weather.event_metadata["delay_factor"])

        # 1. Fetch available operational vehicles
        q_vehicles = self.db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.AVAILABLE, VehicleStatus.ASSIGNED, VehicleStatus.ON_ROUTE])
        )
        if target_vehicle_ids:
            q_vehicles = q_vehicles.filter(Vehicle.id.in_(target_vehicle_ids))
        operational_vehicles = q_vehicles.all()

        # 2. Fetch orders requiring routing (PENDING, ASSIGNED, DELAYED, AT_RISK)
        q_orders = self.db.query(Order).filter(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.ASSIGNED, OrderStatus.DELAYED, OrderStatus.AT_RISK])
        )
        if target_order_ids:
            q_orders = q_orders.filter(Order.id.in_(target_order_ids))
        orders_to_plan = q_orders.all()

        # 3. Snapshot previous active routes for delta comparison
        previous_routes = self.db.query(Route).filter(
            Route.status.in_([RouteStatus.ACTIVE, RouteStatus.IN_PROGRESS])
        ).all()
        prev_plan_metrics = self._calculate_plan_snapshot(previous_routes)

        # 4. Create OptimisationRun record
        last_run = self.db.query(OptimisationRun).order_by(OptimisationRun.started_at.desc()).first()
        run_record = OptimisationRun(
            id=str(uuid.uuid4()),
            trigger_type=trigger_type,
            status=OptimisationRunStatus.STARTED,
            orders_count=len(orders_to_plan),
            vehicles_count=len(operational_vehicles),
            previous_run_id=last_run.id if last_run else None,
            run_metadata={
                "event_id": event.id if event else None,
                "traffic_factor": traffic_factor,
                "weather_factor": weather_factor
            }
        )
        self.db.add(run_record)
        self.db.commit()

        # 5. Run Google OR-Tools Solver
        solver = VRPTSolver(
            vehicles=operational_vehicles,
            orders=orders_to_plan,
            time_limit_seconds=time_limit_seconds,
            traffic_factor=traffic_factor,
            weather_factor=weather_factor,
            allow_drops_with_penalty=True
        )
        solution = await solver.solve()

        # 6. Archive previous routes into RouteVersion and mark SUPERSEDED
        for old_route in previous_routes:
            # Create snapshot JSON
            snapshot = {
                "route_id": old_route.id,
                "vehicle_id": old_route.vehicle_id,
                "distance_km": old_route.total_distance_km,
                "duration_minutes": old_route.total_duration_minutes,
                "cost": old_route.total_cost,
                "stops": [
                    {
                        "sequence": s.sequence,
                        "order_id": s.order_id,
                        "planned_arrival": s.planned_arrival,
                        "planned_departure": s.planned_departure
                    }
                    for s in old_route.stops
                ]
            }
            version_record = RouteVersion(
                id=str(uuid.uuid4()),
                route_id=old_route.id,
                version_number=old_route.version,
                snapshot_json=snapshot,
                change_reason=f"Superseded by run {run_record.id} triggered by {trigger_type.value}"
            )
            self.db.add(version_record)
            old_route.status = RouteStatus.SUPERSEDED

        # 7. Persist New Routes & RouteStops
        created_routes = []
        new_assignments: Dict[str, str] = {}  # order_id -> vehicle_id

        for r_data in solution["routes"]:
            new_route = Route(
                id=str(uuid.uuid4()),
                optimisation_run_id=run_record.id,
                vehicle_id=r_data["vehicle_id"],
                total_distance_km=r_data["total_distance_km"],
                total_duration_minutes=r_data["total_duration_minutes"],
                total_cost=r_data["total_cost"],
                expected_fuel_cost=r_data["expected_fuel_cost"],
                expected_toll_cost=r_data["expected_toll_cost"],
                expected_overtime_cost=r_data["expected_overtime_cost"],
                late_delivery_penalty=r_data["late_delivery_penalty"],
                status=RouteStatus.ACTIVE,
                version=1
            )
            self.db.add(new_route)
            self.db.flush()

            # Add stops
            for stop_info in r_data["stops"]:
                stop_record = RouteStop(
                    id=str(uuid.uuid4()),
                    route_id=new_route.id,
                    order_id=stop_info.get("order_id"),
                    sequence=stop_info["sequence"],
                    planned_arrival=stop_info["planned_arrival"],
                    planned_departure=stop_info["planned_departure"],
                    status=StopStatus.PENDING if not stop_info.get("is_depot") else StopStatus.COMPLETED
                )
                self.db.add(stop_record)

                if stop_info.get("order_id"):
                    new_assignments[stop_info["order_id"]] = r_data["vehicle_id"]
                    # Update order status & vehicle
                    order_obj = self.db.query(Order).filter(Order.id == stop_info["order_id"]).first()
                    if order_obj:
                        order_obj.assigned_vehicle_id = r_data["vehicle_id"]
                        order_obj.status = OrderStatus.ASSIGNED

            created_routes.append(new_route)

        # Mark unassigned orders as DELAYED or AT_RISK
        for unassigned_id in solution["unassigned_orders"]:
            order_obj = self.db.query(Order).filter(Order.id == unassigned_id).first()
            if order_obj:
                order_obj.assigned_vehicle_id = None
                order_obj.status = OrderStatus.AT_RISK if order_obj.priority in [OrderPriority.CRITICAL, OrderPriority.HIGH] else OrderStatus.DELAYED

        # Update OptimisationRun status
        run_record.status = (
            OptimisationRunStatus.FEASIBLE if solution["status"] == "FEASIBLE"
            else OptimisationRunStatus.PARTIALLY_FEASIBLE if solution["status"] == "PARTIALLY_FEASIBLE"
            else OptimisationRunStatus.INFEASIBLE
        )
        run_record.completed_at = datetime.now(timezone.utc)
        run_record.execution_time_ms = solution["execution_time_ms"]
        run_record.total_distance = solution["total_distance_km"]
        run_record.total_cost = solution["total_cost"]
        run_record.late_orders = solution["late_orders_count"]
        run_record.feasible = solution["feasible"]
        run_record.infeasibility_reason = solution.get("infeasibility_reason")
        self.db.commit()

        # 8. Calculate Impact Summary (Delta comparison)
        impact = self._compute_impact(
            prev_plan=prev_plan_metrics,
            new_plan={
                "total_cost": solution["total_cost"],
                "total_distance_km": solution["total_distance_km"],
                "total_duration_minutes": solution["total_duration_minutes"],
                "late_orders": solution["late_orders_count"],
                "assignments": new_assignments,
                "routes_count": len(created_routes)
            },
            trigger=trigger_type.value,
            event=event,
            run_id=run_record.id,
            recommendations=solution.get("recommendations", [])
        )

        # 9. Broadcast changes via WebSocket
        affected_vehicles = list(set(
            [r.vehicle_id for r in previous_routes] + [r.vehicle_id for r in created_routes]
        ))
        await broadcaster.broadcast("ROUTE_UPDATED", {
            "optimisation_run_id": run_record.id,
            "trigger": trigger_type.value,
            "status": run_record.status.value,
            "affected_vehicles": affected_vehicles,
            "orders_reassigned": impact["orders_reassigned"],
            "cost_delta": impact["cost_delta"],
            "distance_delta_km": impact["distance_delta_km"],
            "sla_violations_added": impact["sla_violations_added"]
        })

        return {
            "run": run_record,
            "solution": solution,
            "impact": impact,
            "routes": created_routes
        }

    def _calculate_plan_snapshot(self, routes: List[Route]) -> Dict[str, Any]:
        total_cost = 0.0
        total_dist = 0.0
        total_dur = 0.0
        assignments = {}
        for r in routes:
            total_cost += r.total_cost
            total_dist += r.total_distance_km
            total_dur += r.total_duration_minutes
            for s in r.stops:
                if s.order_id:
                    assignments[s.order_id] = r.vehicle_id

        return {
            "total_cost": round(total_cost, 2),
            "total_distance_km": round(total_dist, 2),
            "total_duration_minutes": round(total_dur, 1),
            "assignments": assignments,
            "routes_count": len(routes)
        }

    def _compute_impact(
        self,
        prev_plan: Dict[str, Any],
        new_plan: Dict[str, Any],
        trigger: str,
        event: Optional[Event],
        run_id: str,
        recommendations: List[str]
    ) -> Dict[str, Any]:
        cost_delta = round(new_plan["total_cost"] - prev_plan["total_cost"], 2)
        dist_delta = round(new_plan["total_distance_km"] - prev_plan["total_distance_km"], 2)
        dur_delta = round(new_plan["total_duration_minutes"] - prev_plan["total_duration_minutes"], 1)
        
        # Count reassigned orders
        affected_orders_set = set()
        prev_assigns = prev_plan["assignments"]
        new_assigns = new_plan["assignments"]
        for o_id, new_v in new_assigns.items():
            if o_id in prev_assigns and prev_assigns[o_id] != new_v:
                affected_orders_set.add(o_id)
            elif o_id not in prev_assigns:
                affected_orders_set.add(o_id)
        for o_id in prev_assigns:
            if o_id not in new_assigns:
                affected_orders_set.add(o_id)

        affected_orders_list = list(affected_orders_set)
        reassigned_count = len(affected_orders_list)

        routes_changed = abs(new_plan["routes_count"] - prev_plan["routes_count"]) + (1 if reassigned_count > 0 else 0)

        vehicles_affected = []
        if event and event.vehicle_id:
            vehicles_affected.append(event.vehicle_id)

        return {
            "event_id": event.id if event else None,
            "trigger": trigger,
            "routes_changed": max(1 if reassigned_count > 0 else 0, routes_changed),
            "orders_reassigned": reassigned_count,
            "affected_orders": affected_orders_list,
            "cost_delta": cost_delta,
            "distance_delta_km": dist_delta,
            "eta_delta_minutes": dur_delta,
            "sla_violations_added": new_plan.get("late_orders", 0),
            "vehicles_affected": vehicles_affected,
            "mitigation_recommendations": recommendations,
            "optimisation_run_id": run_id
        }
