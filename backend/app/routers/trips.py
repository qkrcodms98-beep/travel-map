import json
from collections.abc import Mapping, Set
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, Response

from app.deps import get_dong_regions, get_now, get_region_codes, get_repo
from app.errors import ApiError
from app.repository import TripRepository
from app.rules import check_region_code, validate_new_trip, validate_trip_update
from app.schemas import TripListResponse, TripOut, TripResponse

# 여행 API 4개 (API_SPEC 3장). 저장소는 Depends(get_repo)로 받은 것만 쓴다
router = APIRouter(prefix="/api/trips", tags=["trips"])

Repo = Annotated[TripRepository, Depends(get_repo)]
Now = Annotated[datetime, Depends(get_now)]
RegionCodes = Annotated[Set[str], Depends(get_region_codes)]
DongRegions = Annotated[Mapping[str, str], Depends(get_dong_regions)]


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
async def create_trip(
    request: Request, repo: Repo, now: Now, region_codes: RegionCodes, dong_regions: DongRegions
) -> TripResponse:
    data = await read_json(request)
    new_trip = validate_new_trip(data, now=now, region_codes=region_codes, dong_regions=dong_regions)
    return TripResponse(trip=TripOut.from_trip(repo.create(new_trip, now)))


# 여행 수정 (API_SPEC 3-3). 그 id의 여행이 있는지를 내용 검사보다 먼저 본다 (5장 0단계)
@router.put("/{trip_id}")
async def update_trip(
    trip_id: str, request: Request, repo: Repo, now: Now, dong_regions: DongRegions
) -> TripResponse:
    trip = repo.get(trip_id)
    if trip is None:
        raise ApiError("TRIP_NOT_FOUND")
    data = await read_json(request)
    trip_input = validate_trip_update(data, now=now, region_code=trip.region_code, dong_regions=dong_regions)
    updated = repo.update(trip_id, trip_input, now)
    # 확인한 사이에 지워졌을 때
    if updated is None:
        raise ApiError("TRIP_NOT_FOUND")
    return TripResponse(trip=TripOut.from_trip(updated))


# 여행 삭제 (API_SPEC 3-4). 204는 본문 없이 돌려준다
@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: str, repo: Repo) -> Response:
    if not repo.delete(trip_id):
        raise ApiError("TRIP_NOT_FOUND")
    return Response(status_code=204)
