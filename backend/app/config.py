"""Application configuration loaded from environment variables.

Secrets are never hardcoded — everything comes from the environment
(or a local .env in development).
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg://kaze:kaze_dev_password@localhost:5432/kaze"

    # Auth / JWT
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # OTP
    otp_dev_mode: bool = True
    sms_provider: str = "stub"

    # Pricing defaults (seed values; live values live in pricing_rules table)
    default_markup_percent: float = 0.10
    default_service_fee_per_item_jpy: int = 400
    default_shipping_fee_per_kg_jpy: int = 350
    default_fx_rate_jpy_mnt: float = 22.5
    default_fx_mode: str = "manual"

    # FX live mode
    fx_live_api_url: str = ""
    fx_live_api_key: str = ""

    # Payments
    qpay_base_url: str = "https://merchant.qpay.mn/v2"
    qpay_username: str = ""
    qpay_password: str = ""
    qpay_invoice_code: str = ""
    qpay_callback_url: str = "http://localhost:8000/payments/qpay/callback"
    payment_provider: str = "stub"

    # Storage
    storage_backend: str = "local"
    upload_dir: str = "/app/uploads"
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "product-images"

    # App
    cors_origins: str = "http://localhost:3000"
    env: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
