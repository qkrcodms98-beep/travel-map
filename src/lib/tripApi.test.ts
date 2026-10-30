import { createTrip, deleteTrip, fetchTrips, updateTrip } from "@/lib/tripApi";
import { TripStoreError } from "@/lib/tripStoreError";
import type { NewTrip, Trip, TripInput } from "@/types/trip";

const API_URL = "http://localhost:8000";

const TRIP: Trip = {
  id: "6f1c2a4e-8b3d-4c2a-9f1e-2d7b5a9c0e11",
  regionCode: "99010",
  startDate: "2026-05-01",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z",
};
const NEW_TRIP: NewTrip = { regionCode: "99010", startDate: "2026-05-01", endDate: null, diary: "", dongCodes: [] };
const TRIP_INPUT: TripInput = { startDate: "2026-04-01", endDate: null, diary: "고침", dongCodes: [] };

// 진짜 서버 대신 쓰는 가짜 fetch
const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

// 가짜 응답. json()은 본문이 있을 때만 쓴다
function reply(status: number, body?: unknown): Response {
  const response: Pick<Response, "ok" | "status" | "json"> = {
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new SyntaxError("본문 없음")) : Promise.resolve(body)),
  };
  return response as Response;
}

// 마지막으로 부른 주소와 옵션
function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), init: init ?? {} };
}

// 실패한 Promise에서 TripStoreError의 code를 꺼낸다
async function errorCodeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof TripStoreError) return error.code;
    throw error;
  }
  throw new Error("실패해야 하는데 성공했어요.");
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.NEXT_PUBLIC_API_URL = API_URL;
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

describe("fetchTrips", () => {
  it("전체 목록은 GET /api/trips", async () => {
    fetchMock.mockResolvedValue(reply(200, { trips: [TRIP] }));

    await expect(fetchTrips()).resolves.toEqual([TRIP]);
    const { url, init } = lastCall();
    expect(url).toBe("http://localhost:8000/api/trips");
    expect(init.method ?? "GET").toBe("GET");
  });

  it("지역 목록은 ?regionCode=를 붙인다", async () => {
    fetchMock.mockResolvedValue(reply(200, { trips: [] }));

    await expect(fetchTrips("27720")).resolves.toEqual([]);
    expect(lastCall().url).toBe("http://localhost:8000/api/trips?regionCode=27720");
  });
});

describe("createTrip", () => {
  it("POST /api/trips에 JSON 본문을 보내고 저장된 여행을 돌려준다", async () => {
    fetchMock.mockResolvedValue(reply(201, { trip: TRIP }));

    await expect(createTrip(NEW_TRIP)).resolves.toEqual(TRIP);
    const { url, init } = lastCall();
    expect(url).toBe("http://localhost:8000/api/trips");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual(NEW_TRIP);
  });

  it("서버가 400이면 error.code를 담아 던진다", async () => {
    fetchMock.mockResolvedValue(
      reply(400, { error: { code: "START_DATE_IN_FUTURE", message: "시작일은 오늘까지만 고를 수 있어요." } }),
    );

    await expect(errorCodeOf(createTrip(NEW_TRIP))).resolves.toBe("START_DATE_IN_FUTURE");
  });

  it("서버가 500이면 INTERNAL_ERROR", async () => {
    fetchMock.mockResolvedValue(reply(500, { error: { code: "INTERNAL_ERROR", message: "잠시 후 다시 시도해 주세요." } }));

    await expect(errorCodeOf(createTrip(NEW_TRIP))).resolves.toBe("INTERNAL_ERROR");
  });
});

describe("updateTrip", () => {
  it("PUT /api/trips/{id}에 JSON 본문을 보내고 고친 여행을 돌려준다", async () => {
    const updated = { ...TRIP, ...TRIP_INPUT };
    fetchMock.mockResolvedValue(reply(200, { trip: updated }));

    await expect(updateTrip(TRIP.id, TRIP_INPUT)).resolves.toEqual(updated);
    const { url, init } = lastCall();
    expect(url).toBe(`http://localhost:8000/api/trips/${TRIP.id}`);
    expect(init.method).toBe("PUT");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual(TRIP_INPUT);
  });

  it("서버가 404면 TRIP_NOT_FOUND를 던진다", async () => {
    fetchMock.mockResolvedValue(reply(404, { error: { code: "TRIP_NOT_FOUND", message: "여행을 찾을 수 없어요." } }));

    await expect(errorCodeOf(updateTrip(TRIP.id, TRIP_INPUT))).resolves.toBe("TRIP_NOT_FOUND");
  });
});

describe("deleteTrip", () => {
  it("DELETE /api/trips/{id}. 204는 본문을 읽지 않는다", async () => {
    fetchMock.mockResolvedValue(reply(204));

    await expect(deleteTrip(TRIP.id)).resolves.toBeUndefined();
    const { url, init } = lastCall();
    expect(url).toBe(`http://localhost:8000/api/trips/${TRIP.id}`);
    expect(init.method).toBe("DELETE");
  });

  it("서버가 404면 TRIP_NOT_FOUND를 던진다", async () => {
    fetchMock.mockResolvedValue(reply(404, { error: { code: "TRIP_NOT_FOUND", message: "여행을 찾을 수 없어요." } }));

    await expect(errorCodeOf(deleteTrip(TRIP.id))).resolves.toBe("TRIP_NOT_FOUND");
  });
});

describe("서버·네트워크 문제", () => {
  it("서버에 닿지 못하면(fetch 실패) NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(errorCodeOf(fetchTrips())).resolves.toBe("NETWORK_ERROR");
  });

  it("에러 본문이 API_SPEC 모양이 아니면 INTERNAL_ERROR", async () => {
    fetchMock.mockResolvedValue(reply(502));

    await expect(errorCodeOf(fetchTrips())).resolves.toBe("INTERNAL_ERROR");
  });
});

describe("NEXT_PUBLIC_API_URL", () => {
  it("주소는 NEXT_PUBLIC_API_URL에서 읽는다", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    fetchMock.mockResolvedValue(reply(200, { trips: [] }));

    await fetchTrips();
    expect(lastCall().url).toBe("https://api.example.com/api/trips");
  });

  it("끝에 /가 있어도 //가 되지 않는다", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/";
    fetchMock.mockResolvedValue(reply(200, { trips: [] }));

    await fetchTrips();
    expect(lastCall().url).toBe("http://localhost:8000/api/trips");
  });

  it("값이 없으면 서버를 부르지 않고 실패한다", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    await expect(fetchTrips()).rejects.toThrow("NEXT_PUBLIC_API_URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
