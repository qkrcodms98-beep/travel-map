from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_serializer
from pydantic.alias_generators import to_camel


# 요청 JSON 모양 검사용 (API_SPEC 5장 1단계, TRD 8장)
# camelCase 이름만 받고, 모르는 필드는 막고, 숫자를 글자로 바꿔 주지 않는다
class RequestModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, extra="forbid", strict=True)


# 새 여행 요청. 시작일은 비어 있어도 여기서는 통과시킨다 (2단계에서 거른다)
class NewTripBody(RequestModel):
    region_code: str
    start_date: str | None = None
    end_date: str | None = None
    diary: str = ""
    dong_codes: list[str] = Field(default_factory=list)


# 수정 요청. 일기·동네가 몰래 지워지지 않게 시작일 말고는 모두 필수다
class TripUpdateBody(RequestModel):
    start_date: str | None = None
    end_date: str | None
    diary: str
    dong_codes: list[str]


# 검사를 통과한 수정 값 (화면의 TripInput)
@dataclass
class TripInput:
    start_date: str
    end_date: str | None
    diary: str
    dong_codes: list[str]


# 검사를 통과한 새 여행 값 (화면의 NewTrip)
@dataclass
class NewTrip(TripInput):
    region_code: str


# 저장된 여행 한 개 (DATA_MODEL 4장)
@dataclass
class Trip(NewTrip):
    id: str
    created_at: datetime  # 기록한 시각. 수정해도 그대로
    updated_at: datetime  # 마지막으로 수정한 시각


# 응답 JSON 모양. 파이썬 이름으로 만들고 camelCase로 내보낸다
class ResponseModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, validate_by_name=True, serialize_by_alias=True)


# 응답의 여행(Trip) JSON (API_SPEC 2장)
class TripOut(ResponseModel):
    id: str
    region_code: str
    start_date: str
    end_date: str | None
    diary: str
    dong_codes: list[str]
    created_at: datetime
    updated_at: datetime

    # 시각은 UTC, 밀리초 3자리 + Z (예: 2026-05-05T09:12:30.000Z)
    @field_serializer("created_at", "updated_at")
    def format_time(self, value: datetime) -> str:
        return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    @classmethod
    def from_trip(cls, trip: Trip) -> Self:
        return cls(
            id=trip.id,
            region_code=trip.region_code,
            start_date=trip.start_date,
            end_date=trip.end_date,
            diary=trip.diary,
            dong_codes=trip.dong_codes,
            created_at=trip.created_at,
            updated_at=trip.updated_at,
        )


# { "trip": 여행 }
class TripResponse(ResponseModel):
    trip: TripOut


# { "trips": [여행, ...] }
class TripListResponse(ResponseModel):
    trips: list[TripOut]
