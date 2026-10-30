import { countVisits } from "@/lib/countVisits";
import type { Trip } from "@/types/trip";

// 가짜 여행 (TEST_CASES 2장). A = 99010, B = 99020
const T1: Trip = {
  id: "t1",
  regionCode: "99010",
  startDate: "2026-05-01",
  endDate: "2026-05-02",
  diary: "",
  dongCodes: [],
  createdAt: "2026-05-03T00:00:00Z",
  updatedAt: "2026-05-03T00:00:00Z",
};

const T2: Trip = {
  id: "t2",
  regionCode: "99010",
  startDate: "2026-06-01",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-06-02T00:00:00Z",
  updatedAt: "2026-06-02T00:00:00Z",
};

const B1: Trip = {
  id: "b1",
  regionCode: "99020",
  startDate: "2026-09-01",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-09-02T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};

// 지역별 여행 개수 세기 (TEST_CASES 3-1)
describe("countVisits", () => {
  it("LOGIC-01 여행이 없으면 빈 객체를 돌려준다", () => {
    expect(countVisits([])).toEqual({});
  });

  it("LOGIC-02 T1, T2, B1이면 A는 2번, B는 1번이다", () => {
    expect(countVisits([T1, T2, B1])).toEqual({ "99010": 2, "99020": 1 });
  });
});
