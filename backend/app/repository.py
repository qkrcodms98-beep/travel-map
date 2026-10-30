from dataclasses import replace
from datetime import datetime
from typing import Protocol
from uuid import uuid4

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
