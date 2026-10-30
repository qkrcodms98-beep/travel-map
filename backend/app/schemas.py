from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
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
