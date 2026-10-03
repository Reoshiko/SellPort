from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True

    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"
    redis_url: str = "redis://localhost:6379/0"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key_id: str = "sellport"
    s3_secret_access_key: str = "sellport-local-secret"
    s3_bucket_name: str = "sellport"
    s3_region: str = "us-east-1"

    jwt_secret_key: str = "change_me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 3

    cors_origin: str = "http://localhost"


settings = Settings()
