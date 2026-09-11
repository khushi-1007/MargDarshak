from typing import Any, Dict, List, Tuple
import httpx
from app.config import settings
from app.core.logging import logger
from app.services.routing.provider_base import RoutingProvider
from app.services.routing.mock_provider import MockRoutingProvider


class OSRMRoutingProvider(RoutingProvider):
    """
    OSRM Routing Provider communicating with an OSRM HTTP backend.
    Falls back gracefully to MockRoutingProvider if OSRM is unavailable.
    """

    def __init__(self, base_url: str = None):
        self.base_url = (base_url or settings.ROUTING_API_URL or "http://router.project-osrm.org").rstrip("/")
        self.mock_fallback = MockRoutingProvider()

    async def geocode(self, address: str) -> Tuple[float, float]:
        # OSRM is a routing engine, not a geocoder; use mock or Nominatim
        return await self.mock_fallback.geocode(address)

    async def get_distance_matrix(self, locations: List[Tuple[float, float]]) -> List[List[float]]:
        if not settings.ROUTING_API_URL or len(locations) > 25:
            return await self.mock_fallback.get_distance_matrix(locations)

        try:
            # Format: {lon1},{lat1};{lon2},{lat2}...
            coords_str = ";".join(f"{lon},{lat}" for lat, lon in locations)
            url = f"{self.base_url}/table/v1/driving/{coords_str}?annotations=distance"
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    # Distances in meters, convert to km
                    return [[round(m / 1000.0, 3) for m in row] for row in data["distances"]]
        except Exception as e:
            logger.warning(f"OSRM distance matrix failed, falling back to mock: {e}")
        return await self.mock_fallback.get_distance_matrix(locations)

    async def get_duration_matrix(self, locations: List[Tuple[float, float]], traffic_factor: float = 1.0) -> List[List[float]]:
        if not settings.ROUTING_API_URL or len(locations) > 25:
            return await self.mock_fallback.get_duration_matrix(locations, traffic_factor=traffic_factor)

        try:
            coords_str = ";".join(f"{lon},{lat}" for lat, lon in locations)
            url = f"{self.base_url}/table/v1/driving/{coords_str}?annotations=duration"
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    # Durations in seconds, convert to minutes and apply traffic_factor
                    return [[round((sec / 60.0) * traffic_factor, 1) for sec in row] for row in data["durations"]]
        except Exception as e:
            logger.warning(f"OSRM duration matrix failed, falling back to mock: {e}")
        return await self.mock_fallback.get_duration_matrix(locations, traffic_factor=traffic_factor)

    async def get_route_geometry(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
        if not settings.ROUTING_API_URL:
            return await self.mock_fallback.get_route_geometry(origin, destination)

        try:
            url = f"{self.base_url}/route/v1/driving/{origin[1]},{origin[0]};{destination[1]},{destination[0]}?overview=full&geometries=geojson"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    route = data["routes"][0]
                    return {
                        "type": "LineString",
                        "coordinates": route["geometry"]["coordinates"],
                        "distance_km": round(route["distance"] / 1000.0, 2),
                        "duration_minutes": round(route["duration"] / 60.0, 1),
                    }
        except Exception as e:
            logger.warning(f"OSRM route geometry failed, falling back to mock: {e}")
        return await self.mock_fallback.get_route_geometry(origin, destination)
