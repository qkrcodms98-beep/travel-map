# VAL: 입력 검사 (TEST_CASES 4장). 화면의 src/lib/tripRules.test.ts와 같은 값, 같은 결과
from collections.abc import Callable
from datetime import UTC, datetime

import pytest

import app.rules
from app.errors import ApiError
from app.rules import validate_new_trip, validate_trip_update
from app.schemas import NewTrip, TripInput
from tests.fake_codes import FAKE_REGION_CODES

# 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
NOW = datetime(2026, 10, 29, 3, 0, 0, tzinfo=UTC)

# 정상 값 (TEST_CASES 4장). 테스트마다 여기서 한 칸만 바꾼다
VALID_NEW: dict[str, object] = {
    "regionCode": "99010",
    "startDate": "2026-10-01",
    "endDate": None,
    "diary": "",
    "dongCodes": [],
}
VALID_UPDATE: dict[str, object] = {"startDate": "2026-10-01", "endDate": None, "diary": "", "dongCodes": []}

EXPECTED_NEW = NewTrip(region_code="99010", start_date="2026-10-01", end_date=None, diary="", dong_codes=[])


def check_new(data: object, now: datetime = NOW) -> NewTrip:
    return validate_new_trip(data, now=now, region_codes=FAKE_REGION_CODES)


def check_update(data: object, now: datetime = NOW) -> TripInput:
    return validate_trip_update(data, now=now)


# 검사가 실패할 때 나온 에러 코드
def error_code(check: Callable[[], object]) -> str:
    with pytest.raises(ApiError) as caught:
        check()
    return caught.value.code


# 한 칸만 바꾼 새 여행 값
def new_with(**changes: object) -> dict[str, object]:
    return {**VALID_NEW, **changes}


# 필드 하나를 뺀 복사본
def without(value: dict[str, object], key: str) -> dict[str, object]:
    return {k: v for k, v in value.items() if k != key}


# 4-1. 시작일
def test_val01_valid_value_passes() -> None:
    assert check_new(VALID_NEW) == EXPECTED_NEW


def test_val02_missing_start_date() -> None:
    assert error_code(lambda: check_new(without(VALID_NEW, "startDate"))) == "START_DATE_REQUIRED"


def test_val03_null_start_date() -> None:
    assert error_code(lambda: check_new(new_with(startDate=None))) == "START_DATE_REQUIRED"


def test_val04_empty_start_date() -> None:
    assert error_code(lambda: check_new(new_with(startDate=""))) == "START_DATE_REQUIRED"


def test_val05_slash_date_is_invalid() -> None:
    assert error_code(lambda: check_new(new_with(startDate="2026/05/03"))) == "INVALID_DATE"


def test_val06_nonexistent_date_is_invalid() -> None:
    assert error_code(lambda: check_new(new_with(startDate="2026-02-30"))) == "INVALID_DATE"


def test_val07_today_is_allowed() -> None:
    assert check_new(new_with(startDate="2026-10-29")).start_date == "2026-10-29"


def test_val08_tomorrow_is_future() -> None:
    assert error_code(lambda: check_new(new_with(startDate="2026-10-30"))) == "START_DATE_IN_FUTURE"


# UTC로는 아직 10-28이지만 한국은 10-29 새벽이다
def test_val09_seoul_early_morning_is_not_blocked() -> None:
    now = datetime(2026, 10, 28, 15, 30, 0, tzinfo=UTC)
    assert check_new(new_with(startDate="2026-10-29"), now).start_date == "2026-10-29"


def test_val10_seoul_last_second_blocks_next_day() -> None:
    now = datetime(2026, 10, 29, 14, 59, 59, tzinfo=UTC)
    assert error_code(lambda: check_new(new_with(startDate="2026-10-30"), now)) == "START_DATE_IN_FUTURE"


def test_val11_seoul_midnight_allows_new_day() -> None:
    now = datetime(2026, 10, 29, 15, 0, 0, tzinfo=UTC)
    assert check_new(new_with(startDate="2026-10-30"), now).start_date == "2026-10-30"


# 4-2. 종료일
def test_val20_missing_end_date_becomes_null() -> None:
    assert check_new(without(VALID_NEW, "endDate")) == EXPECTED_NEW


def test_val21_same_day_end_date_passes() -> None:
    assert check_new(new_with(startDate="2026-10-01", endDate="2026-10-01")).end_date == "2026-10-01"


def test_val22_end_before_start() -> None:
    result = error_code(lambda: check_new(new_with(startDate="2026-10-02", endDate="2026-10-01")))
    assert result == "END_DATE_BEFORE_START"


def test_val23_future_end_date_passes() -> None:
    assert check_new(new_with(startDate="2026-10-29", endDate="2026-10-30")).end_date == "2026-10-30"


def test_val24_invalid_end_date() -> None:
    assert error_code(lambda: check_new(new_with(endDate="2026-13-01"))) == "INVALID_DATE"


# 4-3. 여행일기와 글자 수
def test_val30_missing_diary_becomes_empty() -> None:
    assert check_new(without(VALID_NEW, "diary")) == EXPECTED_NEW


def test_val31_2000_chars_pass() -> None:
    assert check_new(new_with(diary="가" * 2000)).diary == "가" * 2000


def test_val32_2001_chars_too_long() -> None:
    assert error_code(lambda: check_new(new_with(diary="가" * 2001))) == "DIARY_TOO_LONG"


def test_val33_2000_emojis_pass() -> None:
    assert check_new(new_with(diary="😀" * 2000)).diary == "😀" * 2000


def test_val34_2001_emojis_too_long() -> None:
    assert error_code(lambda: check_new(new_with(diary="😀" * 2001))) == "DIARY_TOO_LONG"


def test_val35_1999_chars_plus_one_emoji_pass() -> None:
    assert check_new(new_with(diary="가" * 1999 + "😀")).diary == "가" * 1999 + "😀"


def test_val36_1999_chars_plus_two_emojis_too_long() -> None:
    assert error_code(lambda: check_new(new_with(diary="가" * 1999 + "😀😀"))) == "DIARY_TOO_LONG"


def test_val37_uses_count_diary_chars(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[str] = []
    original = app.rules.count_diary_chars

    # 진짜 함수는 그대로 두고, 불렸는지만 기록한다
    def spy(text: str) -> int:
        calls.append(text)
        return original(text)

    monkeypatch.setattr(app.rules, "count_diary_chars", spy)
    assert check_new(new_with(diary="가😀a")).diary == "가😀a"
    assert calls == ["가😀a"]


# 4-4. 지역과 동네 (v0.3까지 범위)
def test_val40_four_digit_region_code() -> None:
    assert error_code(lambda: check_new(new_with(regionCode="9901"))) == "INVALID_REGION_CODE"


def test_val41_region_code_not_in_list() -> None:
    assert error_code(lambda: check_new(new_with(regionCode="99999"))) == "INVALID_REGION_CODE"


# v0.3까지는 빈 목록만 받는다
def test_val42_dong_codes_not_allowed_yet() -> None:
    assert error_code(lambda: check_new(new_with(dongCodes=["9901010100"]))) == "INVALID_DONG_CODE"


# 4-5. 모양과 검사 순서
def test_val50_unknown_field() -> None:
    assert error_code(lambda: check_new(new_with(note="x"))) == "INVALID_REQUEST"


def test_val51_wrong_type_diary() -> None:
    assert error_code(lambda: check_new(new_with(diary=123))) == "INVALID_REQUEST"


def test_val52_missing_region_code() -> None:
    assert error_code(lambda: check_new(without(VALID_NEW, "regionCode"))) == "INVALID_REQUEST"


def test_val53_update_with_all_fields_passes() -> None:
    expected = TripInput(start_date="2026-10-01", end_date=None, diary="", dong_codes=[])
    assert check_update(VALID_UPDATE) == expected


def test_val54_update_missing_diary() -> None:
    assert error_code(lambda: check_update(without(VALID_UPDATE, "diary"))) == "INVALID_REQUEST"


def test_val55_update_missing_start_date() -> None:
    assert error_code(lambda: check_update(without(VALID_UPDATE, "startDate"))) == "START_DATE_REQUIRED"


def test_val56_update_with_region_code() -> None:
    assert error_code(lambda: check_update({**VALID_UPDATE, "regionCode": "99010"})) == "INVALID_REQUEST"


def test_val57_missing_start_date_wins_over_long_diary() -> None:
    data = {**without(VALID_NEW, "startDate"), "diary": "가" * 2001}
    assert error_code(lambda: check_new(data)) == "START_DATE_REQUIRED"


def test_val58_future_start_wins_over_end_before_start() -> None:
    data = new_with(startDate="2026-10-30", endDate="2026-10-01")
    assert error_code(lambda: check_new(data)) == "START_DATE_IN_FUTURE"


def test_val59_end_before_start_wins_over_long_diary() -> None:
    data = new_with(startDate="2026-10-02", endDate="2026-10-01", diary="가" * 2001)
    assert error_code(lambda: check_new(data)) == "END_DATE_BEFORE_START"


# 백엔드만의 모양 규칙: camelCase만 받는다 (API_SPEC 2장)
def test_snake_case_field_is_unknown() -> None:
    data = {"regionCode": "99010", "start_date": "2026-10-01"}
    assert error_code(lambda: check_new(data)) == "INVALID_REQUEST"


def test_body_must_be_object() -> None:
    assert error_code(lambda: check_new(["not", "an", "object"])) == "INVALID_REQUEST"
