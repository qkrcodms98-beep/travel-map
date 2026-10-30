# PUT /api/trips/{id} (TEST_CASES 6-3)
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.repository import MemoryTripRepository
from app.schemas import NewTrip, Trip
from tests.helpers import assert_error

URL = "/api/trips"
MISSING_ID = "00000000-0000-0000-0000-000000000000"


# 가짜 여행 T1, T2, T3 (모두 A 지역, TEST_CASES 2장)
def add_t1_t2_t3(repo: MemoryTripRepository) -> tuple[Trip, Trip, Trip]:
    def add(start_date: str, end_date: str | None, created_at: datetime) -> Trip:
        new_trip = NewTrip(region_code="99010", start_date=start_date, end_date=end_date, diary="", dong_codes=[])
        return repo.create(new_trip, created_at)

    return (
        add("2026-05-01", "2026-05-02", datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC)),
        add("2026-06-01", None, datetime(2026, 6, 2, 0, 0, 0, tzinfo=UTC)),
        add("2026-07-01", "2026-07-03", datetime(2026, 7, 4, 0, 0, 0, tzinfo=UTC)),
    )


# 수정할 때 보내는 4개 필드 (T2의 지금 값)
def t2_body(**changes: object) -> dict[str, object]:
    return {"startDate": "2026-06-01", "endDate": None, "diary": "", "dongCodes": [], **changes}


def test_api30_change_diary_only(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)
    response = client.put(f"{URL}/{t2.id}", json=t2_body(diary="일기를 고쳤어요."))

    assert response.status_code == 200
    trip = response.json()["trip"]
    assert trip["id"] == t2.id
    assert trip["diary"] == "일기를 고쳤어요."
    assert trip["regionCode"] == "99010"
    assert trip["createdAt"] == "2026-06-02T00:00:00.000Z"
    # 기준 시각 2026-10-29T03:00:00Z
    assert trip["updatedAt"] == "2026-10-29T03:00:00.000Z"
    stored = repo.get(t2.id)
    assert stored is not None and stored.diary == "일기를 고쳤어요."


def test_api31_missing_diary_keeps_saved_diary(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)
    repo.update(t2.id, NewTrip("2026-06-01", None, "원래 일기", [], "99010"), t2.created_at)
    body = {key: value for key, value in t2_body().items() if key != "diary"}

    assert_error(client.put(f"{URL}/{t2.id}", json=body), 400, "INVALID_REQUEST")
    stored = repo.get(t2.id)
    assert stored is not None and stored.diary == "원래 일기"


def test_api32_missing_start_date(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)
    body = {key: value for key, value in t2_body().items() if key != "startDate"}

    assert_error(client.put(f"{URL}/{t2.id}", json=body), 400, "START_DATE_REQUIRED")


def test_api33_region_code_not_allowed(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)

    assert_error(client.put(f"{URL}/{t2.id}", json=t2_body(regionCode="99020")), 400, "INVALID_REQUEST")


def test_api34_missing_id(client: TestClient) -> None:
    assert_error(client.put(f"{URL}/{MISSING_ID}", json=t2_body()), 404, "TRIP_NOT_FOUND")


# 내용 검사보다 404가 먼저 (API_SPEC 5장 0단계)
def test_api35_missing_id_wins_over_bad_content(client: TestClient) -> None:
    body = t2_body(startDate="", diary="가" * 2001)
    assert_error(client.put(f"{URL}/{MISSING_ID}", json=body), 404, "TRIP_NOT_FOUND")


def test_api35_missing_id_wins_over_broken_json(client: TestClient) -> None:
    response = client.put(f"{URL}/{MISSING_ID}", content="{ ", headers={"Content-Type": "application/json"})
    assert_error(response, 404, "TRIP_NOT_FOUND")


def test_api36_id_not_uuid(client: TestClient) -> None:
    assert_error(client.put(f"{URL}/abc", json=t2_body()), 404, "TRIP_NOT_FOUND")


def test_api37_end_before_start(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)
    body = t2_body(startDate="2026-06-02", endDate="2026-06-01")

    assert_error(client.put(f"{URL}/{t2.id}", json=body), 400, "END_DATE_BEFORE_START")


def test_broken_json_on_existing_trip(client: TestClient, repo: MemoryTripRepository) -> None:
    _, t2, _ = add_t1_t2_t3(repo)
    response = client.put(f"{URL}/{t2.id}", content="{ ", headers={"Content-Type": "application/json"})

    assert_error(response, 400, "INVALID_REQUEST")


# 번호 매기기는 화면의 assignTripNumbers가 한다. 여기서는 같은 기준(시작일 → 기록한 시각)으로 줄 세워 확인한다
def test_api38_changed_start_date_changes_order(client: TestClient, repo: MemoryTripRepository) -> None:
    t1, t2, t3 = add_t1_t2_t3(repo)
    body = {"startDate": "2026-04-01", "endDate": "2026-07-03", "diary": "", "dongCodes": []}
    assert client.put(f"{URL}/{t3.id}", json=body).status_code == 200

    trips = client.get(URL, params={"regionCode": "99010"}).json()["trips"]
    ordered = sorted(trips, key=lambda trip: (trip["startDate"], trip["createdAt"]))

    assert [trip["id"] for trip in ordered] == [t3.id, t1.id, t2.id]
