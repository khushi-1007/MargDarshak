from typing import Any, Dict, List, Tuple
from app.services.traffic.traffic_base import TrafficProvider
from app.utils.geo import haversine_distance


class MockTrafficProvider(TrafficProvider):
    """
    Deterministic traffic congestion provider.
    Allows injecting congestion zones (e.g. JLN Marg, MI Road, Tonk Road).
    """

    def __init__(self):
        self.congested_zones: List[Dict[str, Any]] = []
        self.closed_segments: List[Dict[str, Any]] = []

    def add_congestion_zone(self, lat: float, lng: float, radius_km: float, delay_factor: float):
        self.congested_zones.append({
            "lat": lat,
            "lng": lng,
            "radius_km": radius_km,
            "delay_factor": delay_factor
        })

    def add_road_closure(self, lat: float, lng: float, radius_km: float, description: str):
        self.closed_segments.append({
            "lat": lat,
            "lng": lng,
            "radius_km": radius_km,
            "description": description
        })

    def clear_conditions(self):
        self.congested_zones.clear()
        self.closed_segments.clear()

    async def get_traffic_factor(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> float:
        # Midpoint of segment
        mid_lat = (origin[0] + destination[0]) / 2.0
        mid_lng = (origin[1] + destination[1]) / 2.0

        max_factor = 1.0
        for zone in self.congested_zones:
            dist = haversine_distance(mid_lat, mid_lng, zone["lat"], zone["lng"])
            if dist <= zone["radius_km"]:
                max_factor = max(max_factor, zone["delay_factor"])
        return max_factor

    async def get_active_closures(self) -> List[Dict[str, Any]]:
        return list(self.closed_segments)
