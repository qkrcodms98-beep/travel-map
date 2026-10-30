from dataclasses import replace
from datetime import date, datetime
from typing import Protocol
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import TripRow
from app.schemas import NewTrip, Trip, TripInput


# 여행 저장소의 약속. 메모리(v0.2)와 DB(v0.3)가 같은 모양을 지킨다 (TRD 3장)
class TripRepository(Protocol):
    # 전체 여행, 또는 한 지역의 여행. 순서는 정하지 않는다 (API_SPEC 3-1)
    def list(self, region_code: str | None = None) -> list[Trip]: ...

    # 없는 id면 None
    def get(self, trip_id: str) -> Trip | None: ...

    # now: 기록한 시각 (createdAt, updatedAt)
    def create(self, new_trip: NewTrip, now: datetime) -> Trip: ...

    # 날짜·일기·동네만 바꾸고 updatedAt을 now로. 없는 id면 None
    def update(self, trip_id: str, trip_input: TripInput, now: datetime) -> Trip | None: ...

    # 지웠으면 True, 없는 id면 False
    def delete(self, trip_id: str) -> bool: ...


# 서버 메모리 저장소 (v0.2). 서버를 끄면 사라진다
class MemoryTripRepository:
    def __init__(self) -> None:
        self._trips: dict[str, Trip] = {}

    def list(self, region_code: str | None = None) -> list[Trip]:
        return [
            _copy(trip)
            for trip in self._trips.values()
            if region_code is None or trip.region_code == region_code
        ]

    def get(self, trip_id: str) -> Trip | None:
        trip = self._trips.get(trip_id)
        return _copy(trip) if trip else None

    def create(self, new_trip: NewTrip, now: datetime) -> Trip:
        trip = Trip(
            id=str(uuid4()),
            region_code=new_trip.region_code,
            start_date=new_trip.start_date,
            end_date=new_trip.end_date,
            diary=new_trip.diary,
            dong_codes=list(new_trip.dong_codes),
            created_at=now,
            updated_at=now,
        )
        self._trips[trip.id] = trip
        return _copy(trip)

    def update(self, trip_id: str, trip_input: TripInput, now: datetime) -> Trip | None:
        trip = self._trips.get(trip_id)
        if trip is None:
            return None
        updated = replace(
            trip,
            start_date=trip_input.start_date,
            end_date=trip_input.end_date,
            diary=trip_input.diary,
            dong_codes=list(trip_input.dong_codes),
            updated_at=now,
        )
        self._trips[trip_id] = updated
        return _copy(updated)

    def delete(self, trip_id: str) -> bool:
        return self._trips.pop(trip_id, None) is not None


# 바깥에서 돌려받은 여행을 고쳐도 저장된 값이 바뀌지 않게 복사본을 준다
def _copy(trip: Trip) -> Trip:
    return replace(trip, dong_codes=list(trip.dong_codes))


# DB 저장소 (v0.3). 세션 하나를 받아 쓰고, 바꿀 때마다 바로 저장(commit)한다
class SqlTripRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list(self, region_code: str | None = None) -> list[Trip]:
        query = select(TripRow)
        if region_code is not None:
            query = query.where(TripRow.region_code == region_code)
        return [_to_trip(row) for row in self._session.scalars(query)]

    def get(self, trip_id: str) -> Trip | None:
        row = self._find(trip_id)
        return _to_trip(row) if row else None

    def create(self, new_trip: NewTrip, now: datetime) -> Trip:
        row = TripRow(region_code=new_trip.region_code, created_at=now)
        _apply_input(row, new_trip, now)
        self._session.add(row)
        self._commit()
        return _to_trip(row)

    def update(self, trip_id: str, trip_input: TripInput, now: datetime) -> Trip | None:
        row = self._find(trip_id)
        if row is None:
            return None
        _apply_input(row, trip_input, now)
        self._commit()
        return _to_trip(row)

    def delete(self, trip_id: str) -> bool:
        row = self._find(trip_id)
        if row is None:
            return False
        self._session.delete(row)
        self._commit()
        return True

    # uuid 모양이 아닌 id는 DB에 물어보지 않고 "없음"으로 본다
    def _find(self, trip_id: str) -> TripRow | None:
        try:
            row_id = UUID(trip_id)
        except ValueError:
            return None
        return self._session.get(TripRow, row_id)

    # 저장에 실패하면 되돌려서 세션을 다시 쓸 수 있게 한다
    def _commit(self) -> None:
        try:
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise


# 날짜·일기·동네를 DB 한 줄에 채우고 updatedAt을 now로 (새 여행·수정 공통)
def _apply_input(row: TripRow, trip_input: TripInput, now: datetime) -> None:
    row.start_date = date.fromisoformat(trip_input.start_date)
    row.end_date = date.fromisoformat(trip_input.end_date) if trip_input.end_date is not None else None
    row.diary = trip_input.diary
    row.dong_codes = list(trip_input.dong_codes)
    row.updated_at = now


# DB 한 줄 → 여행. 날짜는 "YYYY-MM-DD" 글자로 바꾼다
def _to_trip(row: TripRow) -> Trip:
    return Trip(
        id=str(row.id),
        region_code=row.region_code,
        start_date=row.start_date.isoformat(),
        end_date=row.end_date.isoformat() if row.end_date is not None else None,
        diary=row.diary,
        dong_codes=list(row.dong_codes),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
