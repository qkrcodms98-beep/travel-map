# DELETE /api/trips/{id} (TEST_CASES 6-4)
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.repository import MemoryTripRepository
from app.schemas import NewTrip, Trip
from tests.helpers import assert_error

URL = "/api/trips"
MISSING_ID = "00000000-0000-0000-0000-000000000000"


# 가짜 여행 T2 (TEST_CASES 2장)
def add_t2(repo: MemoryTripRepository) -> Trip:
    new_trip = NewTrip(region_code="99010", start_date="2026-06-01", end_date=None, diary="", dong_codes=[])
    return repo.create(new_trip, datetime(2026, 6, 2, 0, 0, 0, tzinfo=UTC))


# 204는 본문이 비어 있어야 한다
def test_api40_delete_returns_204_with_empty_body(client: TestClient, repo: MemoryTripRepository) -> None:
    t2 = add_t2(repo)
    response = client.delete(f"{URL}/{t2.id}")

    assert response.status_code == 204
    assert response.content == b""


def test_api41_deleted_trip_is_not_in_list(client: TestClient, repo: MemoryTripRepository) -> None:
    t2 = add_t2(repo)
    client.delete(f"{URL}/{t2.id}")

    assert client.get(URL).json() == {"trips": []}


def test_api42_missing_id(client: TestClient) -> None:
    assert_error(client.delete(f"{URL}/{MISSING_ID}"), 404, "TRIP_NOT_FOUND")


def test_api42_id_not_uuid(client: TestClient) -> None:
    assert_error(client.delete(f"{URL}/abc"), 404, "TRIP_NOT_FOUND")


def test_api43_delete_twice(client: TestClient, repo: MemoryTripRepository) -> None:
    t2 = add_t2(repo)

    assert client.delete(f"{URL}/{t2.id}").status_code == 204
    assert_error(client.delete(f"{URL}/{t2.id}"), 404, "TRIP_NOT_FOUND")
