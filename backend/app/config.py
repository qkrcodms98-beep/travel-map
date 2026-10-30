# 설정: backend/.env의 DB 주소를 읽는다 (TRD 7장). 값은 출력하지 않는다
from functools import cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # 환경 변수가 있으면 그것을, 없으면 backend/.env를 읽는다. 모르는 값(CORS_ORIGINS 등)은 넘어간다
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = ""  # 실제 DB
    database_url_test: str = ""  # 테스트용 DB


# DB 주소가 없을 때의 에러
class MissingDatabaseUrlError(RuntimeError):
    def __init__(self, name: str) -> None:
        super().__init__(
            f"{name}이(가) 없어요. backend/.env에 {name}=postgresql+psycopg://... 한 줄을 적어 주세요."
        )


@cache
def get_settings() -> Settings:
    return Settings()


def _require(value: str, name: str) -> str:
    if not value.strip():
        raise MissingDatabaseUrlError(name)
    return value


def get_database_url() -> str:
    return _require(get_settings().database_url, "DATABASE_URL")


def get_test_database_url() -> str:
    return _require(get_settings().database_url_test, "DATABASE_URL_TEST")
