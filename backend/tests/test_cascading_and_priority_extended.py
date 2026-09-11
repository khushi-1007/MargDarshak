import pytest
from app.db.seed import seed_database
from app.models.event import Event, EventSeverity, EventStatus, EventType
from app.models.optimisation_run import OptimisationTriggerType
from app.models.route import Route, RouteStatus
from app.models.route_version import RouteVersion
from app.models.simulation import SimulationScenarioType
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.simulation import SimulationScenarioRequest
from app.services.events.processor import EventProcessor
from app.services.optimisation.reoptimiser import DynamicReoptimiser
from app.services.simulation.simulator import WhatIfSimulator


@pytest.mark.asyncio
async def test_route_versioning_immutability(db_session):
    seed_database(db_session)
    reoptimiser = DynamicReoptimiser(db_session)

    # Initial Run
    res1 = await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)
    assert len(res1["routes"]) > 0
    init_route_ids = [r.id for r in res1["routes"]]

    # Trigger vehicle breakdown
    v03 = db_session.query(Vehicle).filter(Vehicle.vehicle_number == "RJ-14-GC-3003").first()
    v03.status = VehicleStatus.BREAKDOWN
    bd_event = Event(
        type=EventType.VEHICLE_BREAKDOWN,
        severity=EventSeverity.CRITICAL,
        title="V03 Breakdown",
        description="Engine Failure",
        vehicle_id=v03.id,
        status=EventStatus.ACTIVE
    )
    db_session.add(bd_event)
    db_session.commit()

    processor = EventProcessor(db_session)
    res2 = await processor.process_event(bd_event)

    # Verify old routes were archived into RouteVersion and marked SUPERSEDED
    old_routes = db_session.query(Route).filter(Route.id.in_(init_route_ids)).all()
    for r in old_routes:
        assert r.status == RouteStatus.SUPERSEDED

    versions = db_session.query(RouteVersion).filter(RouteVersion.route_id.in_(init_route_ids)).all()
    assert len(versions) > 0
    for v in versions:
        assert v.snapshot_json is not None
        assert "route_id" in v.snapshot_json
        assert "distance_km" in v.snapshot_json
        assert "cost" in v.snapshot_json


@pytest.mark.asyncio
async def test_what_if_simulation_guarantees_production_state_immutability(db_session):
    seed_database(db_session)
    reoptimiser = DynamicReoptimiser(db_session)
    init_res = await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)

    # 1. Capture production plan state
    prod_routes_before = db_session.query(Route).filter(Route.status == RouteStatus.ACTIVE).all()
    prod_metrics_before = {
        "count": len(prod_routes_before),
        "total_dist": sum(r.total_distance_km for r in prod_routes_before),
        "total_cost": sum(r.total_cost for r in prod_routes_before)
    }

    # 2. Execute simulation (e.g. remove vehicle)
    simulator = WhatIfSimulator(db_session)
    sim_res = await simulator.run_scenario(
        SimulationScenarioRequest(
            scenario_name="Test Sim Remove V01",
            scenario_type=SimulationScenarioType.REMOVE_VEHICLE,
            removed_vehicle_id="RJ-14-GA-1001"
        )
    )
    assert sim_res.scenario_name == "Test Sim Remove V01"
    assert sim_res.simulated_plan is not None

    # 3. Compare production plan state after simulation
    prod_routes_after = db_session.query(Route).filter(Route.status == RouteStatus.ACTIVE).all()
    prod_metrics_after = {
        "count": len(prod_routes_after),
        "total_dist": sum(r.total_distance_km for r in prod_routes_after),
        "total_cost": sum(r.total_cost for r in prod_routes_after)
    }

    assert prod_metrics_after["count"] == prod_metrics_before["count"]
    assert prod_metrics_after["total_dist"] == prod_metrics_before["total_dist"]
    assert prod_metrics_after["total_cost"] == prod_metrics_before["total_cost"]
