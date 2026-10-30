from typing import Literal

from fastapi.responses import JSONResponse

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

# 사람이 읽는 안내 문구 (API_SPEC 2장 표)
MESSAGES: dict[ErrorCode, str] = {
    "INVALID_REQUEST": "요청 형식이 올바르지 않아요.",
    "START_DATE_REQUIRED": "시작일을 입력해 주세요.",
    "INVALID_DATE": "날짜 형식이 올바르지 않아요.",
    "START_DATE_IN_FUTURE": "시작일은 오늘까지만 고를 수 있어요.",
    "END_DATE_BEFORE_START": "종료일은 시작일보다 빠를 수 없어요.",
    "DIARY_TOO_LONG": "여행일기는 2,000자까지 쓸 수 있어요.",
    "INVALID_REGION_CODE": "지역을 찾을 수 없어요.",
    "INVALID_DONG_CODE": "동네 코드가 올바르지 않아요.",
    "DUPLICATE_DONG_CODE": "같은 동네를 두 번 고를 수 없어요.",
    "TRIP_NOT_FOUND": "여행을 찾을 수 없어요.",
    "INTERNAL_ERROR": "잠시 후 다시 시도해 주세요.",
}

# 상태 코드. 표에 없으면 400
STATUS_CODES: dict[ErrorCode, int] = {"TRIP_NOT_FOUND": 404, "INTERNAL_ERROR": 500}


# 모든 에러는 이 모양 하나로 돌려준다: { "error": { "code", "message" } }
def error_response(code: ErrorCode) -> JSONResponse:
    return JSONResponse(
        status_code=STATUS_CODES.get(code, 400),
        content={"error": {"code": code, "message": MESSAGES[code]}},
    )


# 규칙을 어겼을 때 던지는 에러. code 하나만 담는다
class ApiError(Exception):
    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code)
        self.code: ErrorCode = code
