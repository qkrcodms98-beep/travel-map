from datetime import datetime
from zoneinfo import ZoneInfo

SEOUL = ZoneInfo("Asia/Seoul")


# 받은 시각의 한국 날짜를 "YYYY-MM-DD"로 돌려준다 (now는 시간대가 붙은 시각)
def today_in_seoul(now: datetime) -> str:
    return now.astimezone(SEOUL).date().isoformat()
