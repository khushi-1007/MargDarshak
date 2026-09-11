import pytest
from app.services.routing.mock_provider import MockRoutingProvider
from app.services.routing.osrm_provider import OSRMRoutingProvider
from app.services.traffic.mock_traffic import MockTrafficProvider
from app.services.weather.mock_weather import MockWeatherProvider
from app.services.weather.openweather_provider import OpenWeatherProvider


@pytest.mark.asyncio
async def test_mock_routing_provider_properties():
    provider = MockRoutingProvider()
    coords = [
        (26.9124, 75.7873),  # Depot
        (26.8500, 75.8000),  # Loc 1
        (26.9300, 75.8200)   # Loc 2
    ]
    dist_mat = await provider.get_distance_matrix(coords)
    dur_mat = await provider.get_duration_matrix(coords)
    n = len(coords)

    assert len(dist_mat) == n
    assert len(dur_mat) == n

    for i in range(n):
        for j in range(n):
            assert dist_mat[i][j] >= 0.0
            assert dur_mat[i][j] >= 0.0
            if i == j:
                assert dist_mat[i][j] == 0.0
                assert dur_mat[i][j] == 0.0


@pytest.mark.asyncio
async def test_osrm_provider_fallback_to_mock_on_network_error():
    # Point OSRM provider to an unreachable host to test fallback
    osrm = OSRMRoutingProvider(base_url="http://127.0.0.1:9999/unreachable")
    coords = [
        (26.9124, 75.7873),
        (26.8500, 75.8000)
    ]
    # Fallback to mock provider should succeed gracefully
    dist_mat = await osrm.get_distance_matrix(coords)
    assert len(dist_mat) == 2
    assert dist_mat[0][0] == 0.0
    assert dist_mat[0][1] > 0.0


@pytest.mark.asyncio
async def test_mock_weather_conditions_and_factors():
    weather = MockWeatherProvider(condition="HEAVY_RAIN", precipitation_mm=25.0)
    resp = await weather.get_current_weather(26.9124, 75.7873)
    assert resp["condition"] == "HEAVY_RAIN"
    assert resp["weather_delay_factor"] == 1.5
    assert resp["is_severe"] is True


@pytest.mark.asyncio
async def test_openweather_provider_fallback_on_invalid_key():
    owp = OpenWeatherProvider(api_key="INVALID_TEST_KEY_123")
    res = await owp.get_current_weather(26.9124, 75.7873)
    assert res is not None
    assert "temperature_c" in res
    assert "weather_delay_factor" in res
    assert res["weather_delay_factor"] >= 1.0


@pytest.mark.asyncio
async def test_mock_traffic_congestion_and_closure():
    traffic = MockTrafficProvider()
    origin = (26.9124, 75.7873)
    destination = (26.8500, 75.8000)

    # Initially normal (factor 1.0)
    factor_normal = await traffic.get_traffic_factor(origin, destination)
    assert factor_normal == 1.0

    # Add congestion zone around origin
    traffic.add_congestion_zone(lat=26.8812, lng=75.7936, radius_km=5.0, delay_factor=1.8)
    factor_congested = await traffic.get_traffic_factor(origin, destination)
    assert factor_congested == 1.8

    # Add road closure
    traffic.add_road_closure(lat=26.8812, lng=75.7936, radius_km=1.0, description="Bridge repair")
    closures = await traffic.get_active_closures()
    assert len(closures) == 1
    assert closures[0]["description"] == "Bridge repair"
