import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PixelForge Media Processor"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/media_db"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath("uploads"))
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost,http://localhost:80,http://localhost:5173,http://localhost:3000,http://127.0.0.1,http://127.0.0.1:80,http://127.0.0.1:5173"
    )
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    class Config:
        env_file = ".env"

settings = Settings()
