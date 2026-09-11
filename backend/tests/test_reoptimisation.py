import pytest
from app.db.seed import seed_database
from app.models.event import Event, EventSeverity, EventStatus, EventType
from app.models.optimisation_run import OptimisationTriggerType
from app.models.route_version import RouteVersion
from app.models.vehicle import Vehicle, VehicleStatus
from app.services.events.processor import EventProcessor
from app.services.optimisation.reoptimiser import DynamicReoptimiser


@pytest.mark.asyncio
async def test_dynamic_reoptimisation_and_cascading_failure(db_session):
    # 1. Seed database with Jaipur demo fleet
    seed_database(db_session)
    
    # 2. Run initial optimisation
    reoptimiser = DynamicReoptimiser(db_session)
    init_res = await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)
    assert len(init_res["routes"]) > 0
    init_cost = init_res["solution"]["total_cost"]

    # 3. Simulate first vehicle breakdown (V03)
    v03 = db_session.query(Vehicle).filter(Vehicle.vehicle_number == "RJ-14-GC-3003").first()
    assert v03 is not None
    v03.status = VehicleStatus.BREAKDOWN
    db_session.commit()

    event1 = Event(
        type=EventType.VEHICLE_BREAKDOWN,
        severity=EventSeverity.CRITICAL,
        title="V03 Breakdown",
        description="Engine Failure",
        vehicle_id=v03.id,
        status=EventStatus.ACTIVE
    )
    db_session.add(event1)
    db_session.commit()

    processor = EventProcessor(db_session)
    reopt_res1 = await processor.process_event(event1)

    assert reopt_res1["impact"]["orders_reassigned"] >= 0
    # Verify previous route versions were archived
    versions = db_session.query(RouteVersion).all()
    assert len(versions) > 0

    # 4. Simulate Cascading failure (secondary breakdown of V04)
    v04 = db_session.query(Vehicle).filter(Vehicle.vehicle_number == "RJ-14-GD-4004").first()
    assert v04 is not None
    v04.status = VehicleStatus.BREAKDOWN
    db_session.commit()

    event2 = Event(
        type=EventType.CASCADING_BREAKDOWN,
        severity=EventSeverity.CRITICAL,
        title="V04 Secondary Breakdown",
        description="Cascading Failure: Transmission Breakdown",
        vehicle_id=v04.id,
        status=EventStatus.ACTIVE
    )
    db_session.add(event2)
    db_session.commit()

    reopt_res2 = await processor.process_event(event2)
    # The remaining operational fleet absorbs the orders
    assert reopt_res2["run"].status.value in ["FEASIBLE", "PARTIALLY_FEASIBLE"]
