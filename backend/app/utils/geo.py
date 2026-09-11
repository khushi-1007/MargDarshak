import math
from typing import Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    # Earth radius in kilometers
    r = 6371.0
    return round(r * c, 3)


def estimate_road_distance(lat1: float, lon1: float, lat2: float, lon2: float, winding_factor: float = 1.3) -> float:
    """
    Estimate realistic road distance accounting for city road network winding.
    """
    straight_dist = haversine_distance(lat1, lon1, lat2, lon2)
    return round(straight_dist * winding_factor, 3)


def estimate_travel_time_minutes(
    distance_km: float, 
    speed_kmh: float = 30.0, 
    traffic_factor: float = 1.0, 
    weather_factor: float = 1.0
) -> float:
    """
    Estimate travel duration in minutes given distance, average city speed,
    traffic multiplier, and weather multiplier.
    """
    effective_speed = max(5.0, speed_kmh / (traffic_factor * weather_factor))
    hours = distance_km / effective_speed
    return round(hours * 60.0, 1)


def validate_coordinates(lat: float, lon: float) -> bool:
    """Verify latitude and longitude are in valid geographical range."""
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
