import { getTodayInSeoul } from "@/lib/getTodayInSeoul";

// 한국 시간의 "오늘". 실제 시계 대신 정해진 시각을 넣는다 (TEST_CASES 3-6)
describe("getTodayInSeoul", () => {
  it("LOGIC-60 한국 12:00이면 그날이다", () => {
    expect(getTodayInSeoul(new Date("2026-10-29T03:00:00Z"))).toBe("2026-10-29");
  });

  // UTC로는 아직 전날이지만 한국은 이미 다음 날이다
  it("LOGIC-61 한국 새벽 00:30이면 UTC 날짜가 아니라 한국 날짜다", () => {
    expect(getTodayInSeoul(new Date("2026-10-28T15:30:00Z"))).toBe("2026-10-29");
  });

  it("LOGIC-62 한국 23:59:59이면 아직 그날이다", () => {
    expect(getTodayInSeoul(new Date("2026-10-29T14:59:59Z"))).toBe("2026-10-29");
  });

  it("LOGIC-63 한국 00:00이 되면 다음 날이다", () => {
    expect(getTodayInSeoul(new Date("2026-10-29T15:00:00Z"))).toBe("2026-10-30");
  });
});
