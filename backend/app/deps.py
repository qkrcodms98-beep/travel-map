# 의존성: 저장소, 지금 시각, 코드 목록, 설정. 테스트에서 바꿔 끼울 수 있게 여기 모은다 (TRD 8장)
import os
from collections.abc import Iterator, Mapping
from datetime import UTC, datetime
from functools import cache
from pathlib import Path
from types import MappingProxyType

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from app.db import get_session_factory
from app.repository import SqlTripRepository, TripRepository

BACKEND_DIR = Path(__file__).resolve().parents[1]
# 화면과 같은 코드 목록 파일 (TRD 6장)
CODES_PATH = BACKEND_DIR.parent / "public" / "data" / "codes.json"
DEFAULT_CORS_ORIGINS = "http://localhost:3000"

# backend/.env의 값을 환경 변수로 읽어 둔다 (이미 있는 환경 변수는 덮어쓰지 않는다)
load_dotenv(BACKEND_DIR / ".env")


# codes.json에서 쓰는 부분만 읽는 모양
class RegionEntry(BaseModel):
    code: str


class DongEntry(BaseModel):
    code: str
    region_code: str = Field(alias="regionCode")


class CodesFile(BaseModel):
    regions: list[RegionEntry]
    dongs: list[DongEntry] = []


# 코드 목록 파일. 처음 한 번만 읽어 둔다
@cache
def read_codes_file() -> CodesFile:
    return CodesFile.model_validate_json(CODES_PATH.read_text(encoding="utf-8"))


# 요청마다 DB 세션을 열고, 응답이 끝나면 닫는다 (v0.3 DB 저장)
def get_repo() -> Iterator[TripRepository]:
    with get_session_factory()() as session:
        yield SqlTripRepository(session)


def get_now() -> datetime:
    return datetime.now(UTC)


# 시·군·구 코드 모음
@cache
def get_region_codes() -> frozenset[str]:
    return frozenset(region.code for region in read_codes_file().regions)


# 동네 코드 → 그 동네가 속한 시·군·구 코드 (v0.4)
@cache
def get_dong_regions() -> Mapping[str, str]:
    return MappingProxyType({dong.code: dong.region_code for dong in read_codes_file().dongs})


# CORS로 허락할 화면 주소들. 쉼표로 여러 개를 적을 수 있다
def get_cors_origins() -> list[str]:
    value = os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in value.split(",") if origin.strip()]
