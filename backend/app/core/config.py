from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "AgroSmart 2.0 API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "agrosmart-dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "sqlite+aiosqlite:///./agrosmart.db"
    DEVICE_API_KEY: str = "agrosmart-device-key-2024"
    # Irrigation thresholds
    VEG_MOISTURE_ON: float = 35.0
    VEG_MOISTURE_OFF: float = 55.0
    PADDY_MOISTURE_ON: float = 60.0
    PADDY_MOISTURE_OFF: float = 80.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
