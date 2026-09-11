import pytest
from app.db.seed import seed_database
from app.models.route import Route
from app.models.simulation import SimulationScenarioType
from app.schemas.simulation import SimulationScenarioRequest
from app.services.optimisation.reoptimiser import DynamicReoptimiser
from app.models.optimisation_run import OptimisationTriggerType
from app.services.simulation.simulator import WhatIfSimulator


@pytest.mark.asyncio
async def test_what_if_simulation_isolation(db_session):
    seed_database(db_session)
    reoptimiser = DynamicReoptimiser(db_session)
    await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)

    routes_count_before = db_session.query(Route).count()

    simulator = WhatIfSimulator(db_session)
    comparison = await simulator.run_scenario(
        SimulationScenarioRequest(
            scenario_name="Test Vehicle Removal",
            scenario_type=SimulationScenarioType.REMOVE_VEHICLE,
            removed_vehicle_id="RJ-14-GA-1001"
        )
    )

    assert comparison.scenario_name == "Test Vehicle Removal"
    assert comparison.current_plan is not None
    assert comparison.simulated_plan is not None
    assert comparison.difference is not None

    # Verify that production database routes were NOT altered or destroyed
    routes_count_after = db_session.query(Route).count()
    assert routes_count_before == routes_count_after
