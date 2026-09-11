from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple


class TrafficProvider(ABC):
    """Abstract interface for live traffic congestion factors and road closures."""

    @abstractmethod
    async def get_traffic_factor(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> float:
        pass

    @abstractmethod
    async def get_active_closures(self) -> List[Dict[str, Any]]:
        pass
