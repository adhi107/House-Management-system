from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_NAME: str = "PropertyHub"
    APP_VERSION: str = "1.0.0"

    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "dev-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "propertyhub"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_TLS: bool = True
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "PropertyHub <noreply@propertyhub.app>"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
