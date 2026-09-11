import pytest
from app.db.seed import seed_database
from app.models.optimisation_run import OptimisationTriggerType
from app.services.analytics.service import AnalyticsService
from app.services.optimisation.reoptimiser import DynamicReoptimiser


@pytest.mark.asyncio
async def test_analytics_kpi_calculations(db_session):
    seed_database(db_session)
    reoptimiser = DynamicReoptimiser(db_session)
    await reoptimiser.reoptimise_fleet(trigger_type=OptimisationTriggerType.MANUAL)

    analytics = AnalyticsService(db_session)
    overview = analytics.get_overview()
    cost = analytics.get_cost_breakdown()
    sla = analytics.get_sla_metrics()
    utilisation = analytics.get_utilisation_metrics()
    plan_vs_actual = analytics.get_plan_vs_actual()

    assert overview.total_orders == 20
    assert overview.active_vehicles > 0
    assert overview.total_distance_km > 0
    assert overview.total_operating_cost > 0

    assert cost.total_cost > 0
    assert cost.base_distance_cost > 0
    assert cost.fuel_cost > 0

    assert sla.total_orders == 20
    assert utilisation.fleet_utilisation_pct >= 0.0
    assert plan_vs_actual is not None
