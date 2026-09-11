from typing import Any, Dict, List, Tuple
from app.services.routing.provider_base import RoutingProvider
from app.utils.geo import haversine_distance, estimate_road_distance, estimate_travel_time_minutes


# Well-known Jaipur landmark coordinates for deterministic geocoding mock
JAIPUR_LANDMARKS = {
    "transport nagar": (26.9080, 75.8360),
    "depot": (26.9124, 75.7873),
    "central hub": (26.9124, 75.7873),
    "vaishali nagar": (26.9066, 75.7410),
    "malviya nagar": (26.8530, 75.8150),
    "mansarovar": (26.8680, 75.7600),
    "c-scheme": (26.9110, 75.8010),
    "raja park": (26.8970, 75.8280),
    "sitapura": (26.7770, 75.8360),
    "jhotwara": (26.9450, 75.7480),
    "vidhyadhar nagar": (26.9630, 75.7820),
    "bapu bazar": (26.9200, 75.8230),
    "jawahar circle": (26.8480, 75.8050),
}


class MockRoutingProvider(RoutingProvider):
    """
    Deterministic Routing Provider for testing and offline execution.
    Calculates accurate road approximations using Haversine * 1.3 winding factor.
    """

    async def geocode(self, address: str) -> Tuple[float, float]:
        norm = address.lower().strip()
        for name, coords in JAIPUR_LANDMARKS.items():
            if name in norm:
                return coords
        # Default Jaipur center
        return (26.9124, 75.7873)

    async def get_distance_matrix(self, locations: List[Tuple[float, float]]) -> List[List[float]]:
        n = len(locations)
        matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i][j] = estimate_road_distance(
                        locations[i][0], locations[i][1],
                        locations[j][0], locations[j][1]
                    )
        return matrix

    async def get_duration_matrix(self, locations: List[Tuple[float, float]], traffic_factor: float = 1.0) -> List[List[float]]:
        n = len(locations)
        dist_matrix = await self.get_distance_matrix(locations)
        matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i][j] = estimate_travel_time_minutes(
                        dist_matrix[i][j],
                        speed_kmh=28.0,
                        traffic_factor=traffic_factor
                    )
        return matrix

    async def get_route_geometry(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
        dist = estimate_road_distance(origin[0], origin[1], destination[0], destination[1])
        dur = estimate_travel_time_minutes(dist, speed_kmh=28.0)
        # Interpolate a smooth 5-point path for visualization
        points = []
        for step in range(6):
            ratio = step / 5.0
            lat = round(origin[0] + (destination[0] - origin[0]) * ratio, 6)
            lng = round(origin[1] + (destination[1] - origin[1]) * ratio, 6)
            points.append({"lat": lat, "lng": lng})

        return {
            "type": "LineString",
            "coordinates": [[p["lng"], p["lat"]] for p in points],
            "distance_km": dist,
            "duration_minutes": dur,
            "waypoints": points
        }
