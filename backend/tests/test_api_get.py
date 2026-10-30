# GET /api/trips (TEST_CASES 6-1, 6-5)
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.repository import MemoryTripRepository
from app.schemas import NewTrip, Trip
from tests.helpers import TRIP_FIELDS, assert_error

URL = "/api/trips"


# 가짜 여행 T1(A 지역), B1(B 지역) (TEST_CASES 2장)
def add_t1_b1(repo: MemoryTripRepository) -> tuple[Trip, Trip]:
    t1 = repo.create(
        NewTrip(region_code="99010", start_date="2026-05-01", end_date="2026-05-02", diary="", dong_codes=[]),
        datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC),
    )
    b1 = repo.create(
        NewTrip(region_code="99020", start_date="2026-09-01", end_date=None, diary="", dong_codes=[]),
        datetime(2026, 9, 2, 0, 0, 0, tzinfo=UTC),
    )
    return t1, b1


def ids_of(response_json: dict[str, list[dict[str, object]]]) -> set[object]:
    return {trip["id"] for trip in response_json["trips"]}


def test_api01_no_trips(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"trips": []}


def test_api02_all_trips(client: TestClient, repo: MemoryTripRepository) -> None:
    t1, b1 = add_t1_b1(repo)
    response = client.get(URL)

    assert response.status_code == 200
    assert ids_of(response.json()) == {t1.id, b1.id}


def test_api03_trips_of_one_region(client: TestClient, repo: MemoryTripRepository) -> None:
    t1, _ = add_t1_b1(repo)
    response = client.get(URL, params={"regionCode": "99010"})

    assert response.status_code == 200
    assert ids_of(response.json()) == {t1.id}


def test_api04_region_code_not_five_digits(client: TestClient) -> None:
    assert_error(client.get(URL, params={"regionCode": "abc"}), 400, "INVALID_REGION_CODE")


def test_api05_region_code_not_in_list(client: TestClient) -> None:
    assert_error(client.get(URL, params={"regionCode": "99999"}), 400, "INVALID_REGION_CODE")


# 번호 같은 계산 값은 응답에 넣지 않는다 (API_SPEC 4장)
def test_api06_only_trip_fields(client: TestClient, repo: MemoryTripRepository) -> None:
    add_t1_b1(repo)
    for trip in client.get(URL).json()["trips"]:
        assert set(trip) == TRIP_FIELDS


def test_api07_camel_case_and_time_format(client: TestClient, repo: MemoryTripRepository) -> None:
    t1, _ = add_t1_b1(repo)
    trip = client.get(URL, params={"regionCode": "99010"}).json()["trips"][0]

    assert trip == {
        "id": t1.id,
        "regionCode": "99010",
        "startDate": "2026-05-01",
        "endDate": "2026-05-02",
        "diary": "",
        "dongCodes": [],
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z",
    }


def test_api11_created_trip_is_in_list(client: TestClient) -> None:
    created = client.post(URL, json={"regionCode": "99010", "startDate": "2026-10-01"}).json()["trip"]

    assert client.get(URL).json() == {"trips": [created]}


# 같은 서버가 켜져 있는 동안 계속 남아 있다
def test_api50_trips_stay_while_server_runs(client: TestClient) -> None:
    created = client.post(URL, json={"regionCode": "99010", "startDate": "2026-10-01"}).json()["trip"]

    for _ in range(3):
        assert client.get(URL).json() == {"trips": [created]}


def test_api62_cors_allows_frontend(client: TestClient) -> None:
    response = client.get(URL, headers={"Origin": "http://localhost:3000"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_api63_cors_blocks_other_origin(client: TestClient) -> None:
    response = client.get(URL, headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in response.headers
