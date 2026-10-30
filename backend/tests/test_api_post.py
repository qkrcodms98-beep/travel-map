# POST /api/trips (TEST_CASES 6-2, 6-5)
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.repository import MemoryTripRepository
from app.schemas import NewTrip, Trip
from tests.conftest import Clock
from tests.helpers import TRIP_FIELDS, assert_error

URL = "/api/trips"
VALID: dict[str, object] = {"regionCode": "99010", "startDate": "2026-10-01"}


def test_api10_create_with_only_required_fields(client: TestClient) -> None:
    response = client.post(URL, json=VALID)

    assert response.status_code == 201
    trip = response.json()["trip"]
    assert set(trip) == TRIP_FIELDS
    assert trip["id"]
    assert trip["regionCode"] == "99010"
    assert trip["startDate"] == "2026-10-01"
    assert trip["endDate"] is None
    assert trip["diary"] == ""
    assert trip["dongCodes"] == []
    # 기준 시각 2026-10-29T03:00:00Z, 밀리초 3자리 + Z (API_SPEC 2장)
    assert trip["createdAt"] == "2026-10-29T03:00:00.000Z"
    assert trip["createdAt"] == trip["updatedAt"]


def test_api10_trip_is_saved(client: TestClient, repo: MemoryTripRepository) -> None:
    trip_id = client.post(URL, json=VALID).json()["trip"]["id"]
    assert [trip.id for trip in repo.list()] == [trip_id]


def test_api12_broken_json(client: TestClient, repo: MemoryTripRepository) -> None:
    response = client.post(URL, content='{ "regionCode": ', headers={"Content-Type": "application/json"})

    assert_error(response, 400, "INVALID_REQUEST")
    assert repo.list() == []


def test_api13_empty_start_date(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "startDate": ""}), 400, "START_DATE_REQUIRED")


def test_api14_future_start_date(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "startDate": "2026-10-30"}), 400, "START_DATE_IN_FUTURE")


# UTC로는 10-28이지만 한국은 10-29 새벽이다
def test_api15_seoul_early_morning_is_not_blocked(client: TestClient, clock: Clock) -> None:
    clock.now = datetime(2026, 10, 28, 15, 30, 0, tzinfo=UTC)
    response = client.post(URL, json={**VALID, "startDate": "2026-10-29"})

    assert response.status_code == 201


def test_api16_end_before_start(client: TestClient) -> None:
    data = {**VALID, "startDate": "2026-10-02", "endDate": "2026-10-01"}
    assert_error(client.post(URL, json=data), 400, "END_DATE_BEFORE_START")


def test_api17_diary_2001_chars(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "diary": "가" * 2001}), 400, "DIARY_TOO_LONG")


def test_api19_diary_2001_emojis(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "diary": "😀" * 2001}), 400, "DIARY_TOO_LONG")


def test_api20_region_code_not_in_list(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "regionCode": "99999"}), 400, "INVALID_REGION_CODE")


# v0.3까지는 동네를 받지 않는다
def test_api21_dong_codes_not_allowed_yet(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "dongCodes": ["9901010100"]}), 400, "INVALID_DONG_CODE")


def test_api24_unknown_field(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "note": "x"}), 400, "INVALID_REQUEST")


def test_api25_snake_case_field(client: TestClient) -> None:
    data = {"regionCode": "99010", "start_date": "2026-10-01"}
    assert_error(client.post(URL, json=data), 400, "INVALID_REQUEST")


def test_api26_wrong_type(client: TestClient) -> None:
    assert_error(client.post(URL, json={**VALID, "diary": 123}), 400, "INVALID_REQUEST")


SECRET = "postgresql://user:secret-password@db.example/internal"


def broken_create(new_trip: NewTrip, now: datetime) -> Trip:
    raise RuntimeError(SECRET)


# 저장소가 예외를 던지면 500, 내부 내용은 숨긴다
def test_api52_api53_repository_error(
    client: TestClient, repo: MemoryTripRepository, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(repo, "create", broken_create)
    response = client.post(URL, json=VALID)

    assert_error(response, 500, "INTERNAL_ERROR")
    assert response.json()["error"]["message"] == "잠시 후 다시 시도해 주세요."
    assert "secret" not in response.text
    assert "RuntimeError" not in response.text
