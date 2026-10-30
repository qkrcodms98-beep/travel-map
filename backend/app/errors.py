from typing import Literal

# API 에러 코드 (API_SPEC 2장)
ErrorCode = Literal[
    "INVALID_REQUEST",
    "START_DATE_REQUIRED",
    "INVALID_DATE",
    "START_DATE_IN_FUTURE",
    "END_DATE_BEFORE_START",
    "DIARY_TOO_LONG",
    "INVALID_REGION_CODE",
    "INVALID_DONG_CODE",
    "DUPLICATE_DONG_CODE",
    "TRIP_NOT_FOUND",
    "INTERNAL_ERROR",
]


# 규칙을 어겼을 때 던지는 에러. code 하나만 담는다
class ApiError(Exception):
    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code: ErrorCode = code
