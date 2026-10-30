# 테스트용 가짜 코드 목록 (TEST_CASES 2장). 화면의 tests/fixtures/codes.ts와 같은 내용이다
FAKE_CODES: dict[str, object] = {
    "version": "test",
    "regions": [
        {"code": "99010", "name": "테스트시 가구"},
        {"code": "99020", "name": "테스트시 나구"},
    ],
    "dongs": [
        {"code": "9901010100", "name": "가동", "regionCode": "99010"},
        {"code": "9901010200", "name": "나동", "regionCode": "99010"},
        {"code": "9902010100", "name": "다동", "regionCode": "99020"},
    ],
}

# 가짜 지역 코드 모음 (A, B)
FAKE_REGION_CODES: frozenset[str] = frozenset({"99010", "99020"})

# 가짜 동네 코드 → 속한 지역 코드 (가동·나동은 A, 다동은 B)
FAKE_DONG_REGIONS: dict[str, str] = {
    "9901010100": "99010",
    "9901010200": "99010",
    "9902010100": "99020",
}
