from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple


class RoutingProvider(ABC):
    """Abstract interface for routing, geocoding and distance matrix calculation."""

    @abstractmethod
    async def geocode(self, address: str) -> Tuple[float, float]:
        """Convert address string to (latitude, longitude)."""
        pass

    @abstractmethod
    async def get_distance_matrix(self, locations: List[Tuple[float, float]]) -> List[List[float]]:
        """
        Return NxN distance matrix in kilometers.
        locations: list of (lat, lng) tuples.
        """
        pass

    @abstractmethod
    async def get_duration_matrix(self, locations: List[Tuple[float, float]], traffic_factor: float = 1.0) -> List[List[float]]:
        """
        Return NxN duration matrix in minutes.
        locations: list of (lat, lng) tuples.
        """
        pass

    @abstractmethod
    async def get_route_geometry(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
        """Return geometry coordinates and step instructions."""
        pass
