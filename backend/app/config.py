from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MargDarshak"
    TAGLINE: str = "When reality changes, the route changes with it."
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./margdarshak.db"
    
    # Security & Auth
    JWT_SECRET: str = "margdarshak_super_secret_jwt_key_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # External APIs (Optional - system falls back to deterministic mocks if missing)
    SARVAM_API_KEY: Optional[str] = None
    SARVAM_MODEL: str = "sarvam-105b-conversations"
    WEATHER_API_KEY: Optional[str] = None
    ROUTING_API_URL: Optional[str] = None  # e.g. "http://router.project-osrm.org"
    REDIS_URL: Optional[str] = None
    
    # Default Depot (Jaipur Central Hub)
    DEFAULT_DEPOT_LAT: float = 26.9124
    DEFAULT_DEPOT_LNG: float = 75.7873
    DEFAULT_DEPOT_NAME: str = "Jaipur Central Logistic Hub (Transport Nagar)"
    
    # Solver defaults
    SOLVER_TIME_LIMIT_SECONDS: int = 15
    MAX_OVERTIME_MINUTES: int = 120
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
