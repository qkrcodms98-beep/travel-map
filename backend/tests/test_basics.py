# BE-01~08: 백엔드 함수 (TEST_CASES 3-10). 화면 쪽 LOGIC-90~93, LOGIC-60~63과 같은 값, 같은 결과
from datetime import UTC, datetime

from app.dates import today_in_seoul
from app.diary import count_diary_chars


def test_be01_empty_text_is_zero() -> None:
    assert count_diary_chars("") == 0


def test_be02_emoji_counts_as_one() -> None:
    assert count_diary_chars("가😀a") == 3


def test_be03_2000_emojis_are_2000_chars() -> None:
    assert count_diary_chars("😀" * 2000) == 2000


def test_be04_family_emoji_counts_each_character() -> None:
    assert count_diary_chars("👨‍👩‍👧") == 5


def test_be05_seoul_noon() -> None:
    assert today_in_seoul(datetime(2026, 10, 29, 3, 0, 0, tzinfo=UTC)) == "2026-10-29"


def test_be06_seoul_after_midnight_is_next_day_of_utc() -> None:
    assert today_in_seoul(datetime(2026, 10, 28, 15, 30, 0, tzinfo=UTC)) == "2026-10-29"


def test_be07_seoul_last_second_of_day() -> None:
    assert today_in_seoul(datetime(2026, 10, 29, 14, 59, 59, tzinfo=UTC)) == "2026-10-29"


def test_be08_seoul_midnight_starts_new_day() -> None:
    assert today_in_seoul(datetime(2026, 10, 29, 15, 0, 0, tzinfo=UTC)) == "2026-10-30"
