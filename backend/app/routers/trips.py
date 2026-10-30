from fastapi import APIRouter

# 여행 API 4개 (API_SPEC 3장). 주소는 기능을 만들 때 추가한다
router = APIRouter(prefix="/api/trips", tags=["trips"])
