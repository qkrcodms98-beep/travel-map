import json
from collections.abc import Set
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.deps import get_now, get_region_codes, get_repo
from app.errors import ApiError
from app.repository import TripRepository
from app.rules import check_region_code, validate_new_trip
from app.schemas import TripListResponse, TripOut, TripResponse

# 여행 API 4개 (API_SPEC 3장). 저장소는 Depends(get_repo)로 받은 것만 쓴다
router = APIRouter(prefix="/api/trips", tags=["trips"])

Repo = Annotated[TripRepository, Depends(get_repo)]
Now = Annotated[datetime, Depends(get_now)]
RegionCodes = Annotated[Set[str], Depends(get_region_codes)]


# 본문을 JSON으로 읽는다. 깨진 JSON이면 INVALID_REQUEST (모양 검사는 rules.py가 한다)
async def read_json(request: Request) -> object:
    try:
        data: object = json.loads(await request.body())
    except ValueError as error:
        raise ApiError("INVALID_REQUEST") from error
    return data


# 여행 목록 (API_SPEC 3-1). regionCode를 넣으면 그 지역만
@router.get("")
def list_trips(
    repo: Repo,
    region_codes: RegionCodes,
    region_code: Annotated[str | None, Query(alias="regionCode")] = None,
) -> TripListResponse:
    if region_code is not None:
        check_region_code(region_code, region_codes)
    return TripListResponse(trips=[TripOut.from_trip(trip) for trip in repo.list(region_code)])


# 여행 추가 (API_SPEC 3-2)
@router.post("", status_code=201)
async def create_trip(request: Request, repo: Repo, now: Now, region_codes: RegionCodes) -> TripResponse:
    new_trip = validate_new_trip(await read_json(request), now=now, region_codes=region_codes)
    return TripResponse(trip=TripOut.from_trip(repo.create(new_trip, now)))
