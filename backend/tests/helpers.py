# API 테스트에서 같이 쓰는 확인 함수
from httpx import Response

# 응답 여행(Trip)의 필드 8개 (API_SPEC 2장, camelCase)
TRIP_FIELDS = {"id", "regionCode", "startDate", "endDate", "diary", "dongCodes", "createdAt", "updatedAt"}


# 에러 응답이 API_SPEC 모양인지 (API-60, API-61)
def assert_error(response: Response, status_code: int, code: str) -> None:
    assert response.status_code == status_code
    body: object = response.json()
    assert isinstance(body, dict)
    assert set(body) == {"error"}
    error: object = body["error"]
    assert isinstance(error, dict)
    assert set(error) == {"code", "message"}
    assert error["code"] == code
    assert isinstance(error["message"], str) and error["message"]
