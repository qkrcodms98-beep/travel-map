import { TripStoreError } from "@/lib/tripStoreError";
import type { RegionCode } from "@/types/region";
import type { NewTrip, Trip, TripInput, TripStore } from "@/types/trip";

// FastAPI 백엔드의 여행 API 4개를 부르는 함수 (API_SPEC 3장)

// 백엔드 주소. Next.js가 빌드할 때 값을 넣어 주므로 process.env.NEXT_PUBLIC_API_URL을 그대로 적어야 한다
function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL이 없어요. .env.local을 확인해 주세요.");
  return `${base.replace(/\/+$/, "")}${path}`;
}

// 에러 본문 { error: { code } }에서 code를 꺼낸다. 모양이 다르면 INTERNAL_ERROR
async function readErrorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      const { error } = body;
      if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
        return error.code;
      }
    }
  } catch {
    // 본문이 JSON이 아니면 아래로
  }
  return "INTERNAL_ERROR";
}

// 서버를 부르고, 실패하면 TripStoreError를 던진다
async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new TripStoreError("NETWORK_ERROR");
  }
  if (!response.ok) throw new TripStoreError(await readErrorCode(response));
  return response;
}

// JSON 본문을 담은 요청 옵션
function jsonInit(method: "POST" | "PUT", body: NewTrip | TripInput): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function tripPath(id: string): string {
  return `/api/trips/${encodeURIComponent(id)}`;
}

// 여행 목록. 지역 코드를 넣으면 그 지역만 (API_SPEC 3-1)
export async function fetchTrips(regionCode?: RegionCode): Promise<Trip[]> {
  const query = regionCode ? `?${new URLSearchParams({ regionCode })}` : "";
  const response = await request(`/api/trips${query}`);
  const body = (await response.json()) as { trips: Trip[] };
  return body.trips;
}

// 여행 추가 (API_SPEC 3-2)
export async function createTrip(input: NewTrip): Promise<Trip> {
  const response = await request("/api/trips", jsonInit("POST", input));
  const body = (await response.json()) as { trip: Trip };
  return body.trip;
}

// 여행 수정 (API_SPEC 3-3)
export async function updateTrip(id: string, input: TripInput): Promise<Trip> {
  const response = await request(tripPath(id), jsonInit("PUT", input));
  const body = (await response.json()) as { trip: Trip };
  return body.trip;
}

// 여행 삭제 (API_SPEC 3-4). 204는 본문이 없어서 읽지 않는다
export async function deleteTrip(id: string): Promise<void> {
  await request(tripPath(id), { method: "DELETE" });
}

// v0.2~: 백엔드를 부르는 저장소 (TripStoreProvider의 기본값)
export const apiTripStore: TripStore = {
  listTrips: fetchTrips,
  createTrip,
  updateTrip,
  deleteTrip,
};
