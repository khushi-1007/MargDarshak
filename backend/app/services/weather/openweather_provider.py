from typing import Any, Dict
import httpx
from app.config import settings
from app.core.logging import logger
from app.services.weather.weather_base import WeatherProvider
from app.services.weather.mock_weather import MockWeatherProvider


class OpenWeatherProvider(WeatherProvider):
    """OpenWeatherMap API driver with seamless mock fallback."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.WEATHER_API_KEY
        self.mock_fallback = MockWeatherProvider()

    async def get_current_weather(self, lat: float, lng: float) -> Dict[str, Any]:
        if not self.api_key:
            return await self.mock_fallback.get_current_weather(lat, lng)

        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={self.api_key}&units=metric"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    main_weather = data.get("weather", [{}])[0].get("main", "Clear")
                    temp = data.get("main", {}).get("temp", 30.0)
                    delay_factor = 1.0
                    if "Rain" in main_weather:
                        delay_factor = 1.3
                    elif "Thunderstorm" in main_weather:
                        delay_factor = 1.6

                    return {
                        "condition": main_weather.upper(),
                        "description": data.get("weather", [{}])[0].get("description", ""),
                        "temperature_c": temp,
                        "humidity_pct": data.get("main", {}).get("humidity", 50),
                        "weather_delay_factor": delay_factor,
                        "is_severe": delay_factor > 1.3
                    }
        except Exception as e:
            logger.warning(f"OpenWeather API call failed ({type(e).__name__}), using mock fallback.")

        return await self.mock_fallback.get_current_weather(lat, lng)

    async def get_forecast(self, lat: float, lng: float) -> Dict[str, Any]:
        return await self.mock_fallback.get_forecast(lat, lng)
