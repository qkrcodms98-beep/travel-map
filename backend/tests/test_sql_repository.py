# SQL 저장소 (TRD 3장). 테스트용 DB(DATABASE_URL_TEST)에 연결한다. "-m db"로만 돈다
# 메모리 저장소와 같은 약속을 지키는지, DB에 정말 남는지 확인한다
from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from sqlalchemy import Engine, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_test_database_url
from app.db import make_engine, make_session_factory
from app.models import TripRow
from app.repository import SqlTripRepository
from app.schemas import NewTrip, TripInput

pytestmark = pytest.mark.db

CREATED = datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC)
UPDATED = datetime(2026, 5, 6, 14, 0, 0, tzinfo=UTC)
MISSING_ID = "00000000-0000-0000-0000-000000000000"


def new_trip(region_code: str = "99010", start_date: str = "2026-05-01", diary: str = "") -> NewTrip:
    return NewTrip(region_code=region_code, start_date=start_date, end_date=None, diary=diary, dong_codes=[])


@pytest.fixture(scope="module")
def engine() -> Iterator[Engine]:
    engine = make_engine(get_test_database_url())
    yield engine
    engine.dispose()


# 테스트마다 trips를 비우고 시작한다
@pytest.fixture
def session_factory(engine: Engine) -> sessionmaker[Session]:
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE trips"))
    return make_session_factory(engine)


@pytest.fixture
def sql_repo(session_factory: sessionmaker[Session]) -> Iterator[SqlTripRepository]:
    with session_factory() as session:
        yield SqlTripRepository(session)


def count_rows(session_factory: sessionmaker[Session]) -> int:
    with session_factory() as session:
        return session.scalar(select(func.count()).select_from(TripRow)) or 0


def test_empty_list(sql_repo: SqlTripRepository) -> None:
    assert sql_repo.list() == []


def test_create_fills_id_and_times(sql_repo: SqlTripRepository) -> None:
    trip = sql_repo.create(new_trip(), CREATED)

    assert trip.id
    assert trip.region_code == "99010"
    assert trip.start_date == "2026-05-01"
    assert trip.end_date is None
    assert trip.diary == ""
    assert trip.dong_codes == []
    assert trip.created_at == CREATED
    assert trip.updated_at == CREATED


def test_create_gives_different_ids(sql_repo: SqlTripRepository) -> None:
    assert sql_repo.create(new_trip(), CREATED).id != sql_repo.create(new_trip(), CREATED).id


def test_list_all_and_by_region(sql_repo: SqlTripRepository) -> None:
    a = sql_repo.create(new_trip("99010"), CREATED)
    b = sql_repo.create(new_trip("99020"), CREATED)

    assert {trip.id for trip in sql_repo.list()} == {a.id, b.id}
    assert [trip.id for trip in sql_repo.list("99010")] == [a.id]


def test_get(sql_repo: SqlTripRepository) -> None:
    trip = sql_repo.create(new_trip(), CREATED)

    assert sql_repo.get(trip.id) == trip
    assert sql_repo.get(MISSING_ID) is None


# id가 uuid 모양이 아니어도 에러 대신 "없음" (API-36)
def test_not_uuid_id_is_missing(sql_repo: SqlTripRepository) -> None:
    trip_input = TripInput(start_date="2026-04-01", end_date=None, diary="", dong_codes=[])

    assert sql_repo.get("abc") is None
    assert sql_repo.update("abc", trip_input, UPDATED) is None
    assert sql_repo.delete("abc") is False


def test_update_changes_fields_and_updated_at_only(sql_repo: SqlTripRepository) -> None:
    trip = sql_repo.create(new_trip(), CREATED)
    trip_input = TripInput(start_date="2026-04-01", end_date="2026-04-02", diary="고침", dong_codes=[])

    updated = sql_repo.update(trip.id, trip_input, UPDATED)

    assert updated is not None
    assert (updated.start_date, updated.end_date, updated.diary) == ("2026-04-01", "2026-04-02", "고침")
    assert updated.region_code == trip.region_code
    assert updated.created_at == CREATED
    assert updated.updated_at == UPDATED
    assert sql_repo.get(trip.id) == updated


def test_update_missing_id_returns_none(sql_repo: SqlTripRepository) -> None:
    trip_input = TripInput(start_date="2026-04-01", end_date=None, diary="", dong_codes=[])
    assert sql_repo.update(MISSING_ID, trip_input, UPDATED) is None


# 지우면 DB에서 그 줄이 실제로 없어진다 (API-44)
def test_delete_removes_row(sql_repo: SqlTripRepository, session_factory: sessionmaker[Session]) -> None:
    trip = sql_repo.create(new_trip(), CREATED)
    assert count_rows(session_factory) == 1

    assert sql_repo.delete(trip.id) is True
    assert count_rows(session_factory) == 0
    assert sql_repo.delete(trip.id) is False


def test_returned_trip_does_not_change_stored_trip(sql_repo: SqlTripRepository) -> None:
    trip = sql_repo.create(new_trip(), CREATED)

    trip.dong_codes.append("9901010100")
    trip.diary = "바깥에서 고침"

    stored = sql_repo.get(trip.id)
    assert stored is not None
    assert stored.dong_codes == []
    assert stored.diary == ""


# 😀 2,000개도 DB가 거부하지 않고 그대로 돌려준다 (API-18)
def test_emoji_diary_2000_chars(sql_repo: SqlTripRepository) -> None:
    diary = "😀" * 2000
    trip = sql_repo.create(new_trip(diary=diary), CREATED)

    stored = sql_repo.get(trip.id)
    assert stored is not None
    assert stored.diary == diary


# 연결을 새로 만들어도 기록이 남아 있다 (API-51)
def test_trip_survives_new_connection(sql_repo: SqlTripRepository) -> None:
    trip = sql_repo.create(new_trip(), CREATED)

    other_engine = make_engine(get_test_database_url())
    try:
        with make_session_factory(other_engine)() as session:
            assert SqlTripRepository(session).get(trip.id) == trip
    finally:
        other_engine.dispose()


# DB도 규칙을 검사한다 (DATA_MODEL 2장). 검사를 건너뛴 값이 들어와도 저장되지 않는다
@pytest.mark.parametrize(
    "bad_trip",
    [
        NewTrip(region_code="abc", start_date="2026-05-01", end_date=None, diary="", dong_codes=[]),
        NewTrip(region_code="99010", start_date="2026-05-02", end_date="2026-05-01", diary="", dong_codes=[]),
        NewTrip(region_code="99010", start_date="2026-05-01", end_date=None, diary="가" * 2001, dong_codes=[]),
    ],
    ids=["region_code", "end_before_start", "diary_2001"],
)
def test_db_rejects_broken_rules(
    sql_repo: SqlTripRepository, session_factory: sessionmaker[Session], bad_trip: NewTrip
) -> None:
    with pytest.raises(IntegrityError):
        sql_repo.create(bad_trip, CREATED)
    assert count_rows(session_factory) == 0
