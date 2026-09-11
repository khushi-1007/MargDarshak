from abc import ABC, abstractmethod
from typing import Any, Dict


class WeatherProvider(ABC):
    """Abstract interface for fetching weather conditions and alerts."""

    @abstractmethod
    async def get_current_weather(self, lat: float, lng: float) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_forecast(self, lat: float, lng: float) -> Dict[str, Any]:
        pass
