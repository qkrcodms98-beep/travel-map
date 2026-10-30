# 의존성: 저장소, 지금 시각, 코드 목록, 설정. 테스트에서 바꿔 끼울 수 있게 여기 모은다 (TRD 8장)
import os
from datetime import UTC, datetime
from functools import cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

from app.repository import MemoryTripRepository, TripRepository

BACKEND_DIR = Path(__file__).resolve().parents[1]
# 화면과 같은 코드 목록 파일 (TRD 6장)
CODES_PATH = BACKEND_DIR.parent / "public" / "data" / "codes.json"
DEFAULT_CORS_ORIGINS = "http://localhost:3000"

# backend/.env의 값을 환경 변수로 읽어 둔다 (이미 있는 환경 변수는 덮어쓰지 않는다)
load_dotenv(BACKEND_DIR / ".env")


# codes.json에서 쓰는 부분만 읽는 모양
class RegionEntry(BaseModel):
    code: str


class CodesFile(BaseModel):
    regions: list[RegionEntry]


# 서버가 켜져 있는 동안 하나의 저장소를 같이 쓴다 (v0.2 서버 메모리)
_memory_repo = MemoryTripRepository()


def get_repo() -> TripRepository:
    return _memory_repo


def get_now() -> datetime:
    return datetime.now(UTC)


# 시·군·구 코드 모음. 처음 한 번만 읽어 둔다
@cache
def get_region_codes() -> frozenset[str]:
    codes = CodesFile.model_validate_json(CODES_PATH.read_text(encoding="utf-8"))
    return frozenset(region.code for region in codes.regions)


# CORS로 허락할 화면 주소들. 쉼표로 여러 개를 적을 수 있다
def get_cors_origins() -> list[str]:
    value = os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in value.split(",") if origin.strip()]
