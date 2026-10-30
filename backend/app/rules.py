import re
from collections.abc import Set
from datetime import date, datetime

from pydantic import ValidationError

from app.dates import today_in_seoul
from app.diary import DIARY_MAX_CHARS, count_diary_chars
from app.errors import ApiError
from app.schemas import NewTrip, NewTripBody, RequestModel, TripInput, TripUpdateBody

# \d는 다른 나라 숫자도 받아서 0-9로 적는다
DATE_PATTERN = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
REGION_CODE_PATTERN = re.compile(r"[0-9]{5}")

# 단계 번호는 API_SPEC 5장의 검사 순서다. 먼저 걸린 에러 하나만 던진다


# "YYYY-MM-DD" 모양이고 실제 있는 날짜인지 (2026-02-30은 안 된다)
def is_real_date(value: str) -> bool:
    if not DATE_PATTERN.fullmatch(value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True


# 1단계: 모양. 받은 JSON을 요청 모델로 바꾸고, 안 맞으면 INVALID_REQUEST
def parse_body[Body: RequestModel](model: type[Body], data: object) -> Body:
    try:
        return model.model_validate(data)
    except ValidationError as error:
        raise ApiError("INVALID_REQUEST") from error


# 3~6단계: 날짜와 일기 (새 여행·수정 공통)
def check_dates_and_diary(start_date: str, end_date: str | None, diary: str, now: datetime) -> None:
    if not is_real_date(start_date) or (end_date is not None and not is_real_date(end_date)):
        raise ApiError("INVALID_DATE")
    if start_date > today_in_seoul(now):
        raise ApiError("START_DATE_IN_FUTURE")
    if end_date is not None and end_date < start_date:
        raise ApiError("END_DATE_BEFORE_START")
    if count_diary_chars(diary) > DIARY_MAX_CHARS:
        raise ApiError("DIARY_TOO_LONG")


# 지역 코드: 숫자 5자리이고 코드 목록에 있는지 (새 여행 7단계, 목록 주소의 regionCode)
def check_region_code(region_code: str, region_codes: Set[str]) -> None:
    if not REGION_CODE_PATTERN.fullmatch(region_code) or region_code not in region_codes:
        raise ApiError("INVALID_REGION_CODE")


# 새 여행 규칙
def validate_new_trip(data: object, *, now: datetime, region_codes: Set[str]) -> NewTrip:
    body = parse_body(NewTripBody, data)
    # 2단계
    if not body.start_date:
        raise ApiError("START_DATE_REQUIRED")
    # 3~6단계
    check_dates_and_diary(body.start_date, body.end_date, body.diary, now)
    # 7단계: 형식과 코드 목록 둘 다 본다
    check_region_code(body.region_code, region_codes)
    # 8단계: v0.3까지는 동네를 받지 않는다
    if body.dong_codes:
        raise ApiError("INVALID_DONG_CODE")

    return NewTrip(
        region_code=body.region_code,
        start_date=body.start_date,
        end_date=body.end_date,
        diary=body.diary,
        dong_codes=body.dong_codes,
    )


# 수정 규칙. 지역은 받지 않으므로 7단계가 없다 (API_SPEC 3-3)
def validate_trip_update(data: object, *, now: datetime) -> TripInput:
    body = parse_body(TripUpdateBody, data)
    # 2단계
    if not body.start_date:
        raise ApiError("START_DATE_REQUIRED")
    # 3~6단계
    check_dates_and_diary(body.start_date, body.end_date, body.diary, now)
    # 8단계: v0.3까지는 동네를 받지 않는다
    if body.dong_codes:
        raise ApiError("INVALID_DONG_CODE")

    return TripInput(
        start_date=body.start_date,
        end_date=body.end_date,
        diary=body.diary,
        dong_codes=body.dong_codes,
    )
