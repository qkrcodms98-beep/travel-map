# API 기반: 에러 모양, 의존성, CORS (API_SPEC 2장·6장, TRD 7장·8장)
from datetime import UTC

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.deps import get_now, get_region_codes, get_repo
from app.errors import ApiError
from app.main import create_app
from app.repository import MemoryTripRepository

SECRET = "postgresql://user:secret-password@db.example/internal"


# 에러 처리기를 확인하려고 테스트 전용 주소를 붙인 앱
def make_app_with_test_routes() -> FastAPI:
    app = create_app()

    @app.get("/test/rule-error")
    def rule_error() -> None:
        raise ApiError("START_DATE_REQUIRED")

    @app.get("/test/not-found")
    def not_found() -> None:
        raise ApiError("TRIP_NOT_FOUND")

    @app.get("/test/query")
    def query(n: int) -> int:
        return n

    @app.get("/test/crash")
    def crash() -> None:
        raise RuntimeError(SECRET)

    return app


@pytest.fixture
def test_client() -> TestClient:
    return TestClient(make_app_with_test_routes(), raise_server_exceptions=False)


def test_api_error_uses_error_shape_and_400(test_client: TestClient) -> None:
    response = test_client.get("/test/rule-error")

    assert response.status_code == 400
    assert response.json() == {"error": {"code": "START_DATE_REQUIRED", "message": "시작일을 입력해 주세요."}}


def test_trip_not_found_is_404(test_client: TestClient) -> None:
    response = test_client.get("/test/not-found")

    assert response.status_code == 404
    assert response.json() == {"error": {"code": "TRIP_NOT_FOUND", "message": "여행을 찾을 수 없어요."}}


# FastAPI 기본 422 대신 400 INVALID_REQUEST (API-61)
def test_fastapi_validation_error_becomes_400(test_client: TestClient) -> None:
    response = test_client.get("/test/query?n=abc")

    assert response.status_code == 400
    assert response.json() == {"error": {"code": "INVALID_REQUEST", "message": "요청 형식이 올바르지 않아요."}}


# 예상하지 못한 에러는 500, 내부 내용은 숨긴다 (API-52, API-53과 같은 규칙)
def test_unexpected_error_is_500_without_details(test_client: TestClient) -> None:
    response = test_client.get("/test/crash")

    assert response.status_code == 500
    assert response.json() == {"error": {"code": "INTERNAL_ERROR", "message": "잠시 후 다시 시도해 주세요."}}
    assert "secret" not in response.text


def test_get_repo_returns_same_memory_repository() -> None:
    repo = get_repo()
    assert isinstance(repo, MemoryTripRepository)
    assert get_repo() is repo


def test_get_now_is_utc_time() -> None:
    assert get_now().tzinfo == UTC


# 진짜 public/data/codes.json을 읽는다
def test_get_region_codes_reads_codes_json() -> None:
    codes = get_region_codes()
    assert "27720" in codes  # 대구 군위군
    assert "41110" in codes  # 수원시 (구를 합침)
    assert "41111" not in codes  # 수원시 장안구는 따로 없다
    assert "99999" not in codes


# CORS (API-62, API-63). 기본 허락 주소는 http://localhost:3000
def test_cors_allows_frontend_origin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    response = TestClient(create_app()).get("/health", headers={"Origin": "http://localhost:3000"})

    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_blocks_other_origin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    response = TestClient(create_app()).get("/health", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in response.headers


def test_cors_origins_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://a.example, http://b.example")
    client = TestClient(create_app())

    for origin in ["http://a.example", "http://b.example"]:
        response = client.get("/health", headers={"Origin": origin})
        assert response.headers.get("access-control-allow-origin") == origin
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert "access-control-allow-origin" not in response.headers
