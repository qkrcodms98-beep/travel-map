# API 테스트 공통 준비물 (TEST_CASES 6장)
# 테스트마다 빈 저장소, 정해 둔 "지금 시각", 가짜 코드 목록을 바꿔 끼운다
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.deps import get_now, get_region_codes, get_repo
from app.main import create_app
from app.repository import MemoryTripRepository
from tests.fake_codes import FAKE_REGION_CODES


# 테스트에서 바꿀 수 있는 시계. 기본은 한국 2026-10-29 12:00 (TEST_CASES 2장)
@dataclass
class Clock:
    now: datetime = datetime(2026, 10, 29, 3, 0, 0, tzinfo=UTC)


@pytest.fixture
def repo() -> MemoryTripRepository:
    return MemoryTripRepository()


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def client(repo: MemoryTripRepository, clock: Clock) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_repo] = lambda: repo
    app.dependency_overrides[get_now] = lambda: clock.now
    app.dependency_overrides[get_region_codes] = lambda: FAKE_REGION_CODES
    # 서버 에러도 예외로 터뜨리지 않고 500 응답으로 받는다 (API-52)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
