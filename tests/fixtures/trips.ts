import type { Trip } from "@/types/trip";

// 테스트용 가짜 여행 (TEST_CASES 2장). 실제 개인 기록이 아니다
// 지역 A = 99010 (테스트시 가구), B = 99020 (테스트시 나구)

export const T1: Trip = {
  id: "t1",
  regionCode: "99010",
  startDate: "2026-05-01",
  endDate: "2026-05-02",
  diary: "",
  dongCodes: [],
  createdAt: "2026-05-03T00:00:00Z",
  updatedAt: "2026-05-03T00:00:00Z",
};

export const T2: Trip = {
  id: "t2",
  regionCode: "99010",
  startDate: "2026-06-01",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-06-02T00:00:00Z",
  updatedAt: "2026-06-02T00:00:00Z",
};

export const T3: Trip = {
  id: "t3",
  regionCode: "99010",
  startDate: "2026-07-01",
  endDate: "2026-07-03",
  diary: "",
  dongCodes: [],
  createdAt: "2026-07-04T00:00:00Z",
  updatedAt: "2026-07-04T00:00:00Z",
};

// S1, S2는 시작일이 같다. S2를 나중에 기록했다
export const S1: Trip = {
  id: "s1",
  regionCode: "99010",
  startDate: "2026-08-15",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-08-16T09:00:00Z",
  updatedAt: "2026-08-16T09:00:00Z",
};

export const S2: Trip = {
  id: "s2",
  regionCode: "99010",
  startDate: "2026-08-15",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-08-16T10:00:00Z",
  updatedAt: "2026-08-16T10:00:00Z",
};

export const B1: Trip = {
  id: "b1",
  regionCode: "99020",
  startDate: "2026-09-01",
  endDate: null,
  diary: "",
  dongCodes: [],
  createdAt: "2026-09-02T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};
