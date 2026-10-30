# 메모리 저장소 (TRD 3장). API 테스트가 쓰는 저장소가 약속대로 동작하는지 확인한다
from datetime import UTC, datetime

from app.repository import MemoryTripRepository, TripRepository
from app.schemas import NewTrip, TripInput

CREATED = datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC)
UPDATED = datetime(2026, 5, 6, 14, 0, 0, tzinfo=UTC)
MISSING_ID = "00000000-0000-0000-0000-000000000000"


def new_trip(region_code: str = "99010", start_date: str = "2026-05-01") -> NewTrip:
    return NewTrip(region_code=region_code, start_date=start_date, end_date=None, diary="", dong_codes=[])


def make_repo() -> TripRepository:
    return MemoryTripRepository()


def test_empty_list() -> None:
    assert make_repo().list() == []


def test_create_fills_id_and_times() -> None:
    repo = make_repo()
    trip = repo.create(new_trip(), CREATED)

    assert trip.id
    assert trip.region_code == "99010"
    assert trip.created_at == CREATED
    assert trip.updated_at == CREATED


def test_create_gives_different_ids() -> None:
    repo = make_repo()
    assert repo.create(new_trip(), CREATED).id != repo.create(new_trip(), CREATED).id


def test_list_all_and_by_region() -> None:
    repo = make_repo()
    a = repo.create(new_trip("99010"), CREATED)
    b = repo.create(new_trip("99020"), CREATED)

    assert {trip.id for trip in repo.list()} == {a.id, b.id}
    assert [trip.id for trip in repo.list("99010")] == [a.id]


def test_get() -> None:
    repo = make_repo()
    trip = repo.create(new_trip(), CREATED)

    assert repo.get(trip.id) == trip
    assert repo.get(MISSING_ID) is None


def test_update_changes_fields_and_updated_at_only() -> None:
    repo = make_repo()
    trip = repo.create(new_trip(), CREATED)
    trip_input = TripInput(start_date="2026-04-01", end_date="2026-04-02", diary="고침", dong_codes=[])

    updated = repo.update(trip.id, trip_input, UPDATED)

    assert updated is not None
    assert (updated.start_date, updated.end_date, updated.diary) == ("2026-04-01", "2026-04-02", "고침")
    assert updated.region_code == trip.region_code
    assert updated.created_at == CREATED
    assert updated.updated_at == UPDATED
    assert repo.get(trip.id) == updated


def test_update_missing_id_returns_none() -> None:
    trip_input = TripInput(start_date="2026-04-01", end_date=None, diary="", dong_codes=[])
    assert make_repo().update(MISSING_ID, trip_input, UPDATED) is None


def test_delete() -> None:
    repo = make_repo()
    trip = repo.create(new_trip(), CREATED)

    assert repo.delete(trip.id) is True
    assert repo.list() == []
    assert repo.delete(trip.id) is False


def test_returned_trip_does_not_change_stored_trip() -> None:
    repo = make_repo()
    trip = repo.create(new_trip(), CREATED)

    trip.dong_codes.append("9901010100")
    trip.diary = "바깥에서 고침"

    stored = repo.get(trip.id)
    assert stored is not None
    assert stored.dong_codes == []
    assert stored.diary == ""
