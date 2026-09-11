from typing import Any, Dict
from app.services.weather.weather_base import WeatherProvider


class MockWeatherProvider(WeatherProvider):
    """Deterministic weather provider for local runs and hackathon demos."""

    def __init__(self, condition: str = "CLEAR", precipitation_mm: float = 0.0):
        self.condition = condition
        self.precipitation_mm = precipitation_mm

    async def get_current_weather(self, lat: float, lng: float) -> Dict[str, Any]:
        weather_factor = 1.0
        if self.condition == "RAIN":
            weather_factor = 1.2
        elif self.condition == "HEAVY_RAIN":
            weather_factor = 1.5
        elif self.condition == "STORM":
            weather_factor = 1.8

        return {
            "condition": self.condition,
            "description": f"Simulated {self.condition.lower()} in Jaipur",
            "temperature_c": 31.5,
            "humidity_pct": 65,
            "precipitation_mm": self.precipitation_mm,
            "weather_delay_factor": weather_factor,
            "is_severe": self.condition in ["HEAVY_RAIN", "STORM"]
        }

    async def get_forecast(self, lat: float, lng: float) -> Dict[str, Any]:
        return {
            "summary": "Stable regional conditions with seasonal monsoon variations",
            "hourly_factors": [1.0, 1.0, 1.1, 1.3, 1.0]
        }
