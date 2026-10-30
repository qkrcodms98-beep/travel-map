import { formatTripDates } from "@/lib/formatTripDates";

// 여행 날짜 글자 (TEST_CASES 3-5)
describe("formatTripDates", () => {
  it("LOGIC-44 종료일이 없으면 당일치기다", () => {
    expect(formatTripDates("2026-05-03", null)).toBe("2026.05.03 (당일치기)");
  });

  it("LOGIC-45 종료일이 시작일과 같으면 당일치기다", () => {
    expect(formatTripDates("2026-05-03", "2026-05-03")).toBe("2026.05.03 (당일치기)");
  });

  it("LOGIC-46 같은 해면 종료일에 연도를 빼고 쓴다", () => {
    expect(formatTripDates("2026-05-03", "2026-05-04")).toBe("2026.05.03 ~ 05.04");
  });

  it("LOGIC-47 달을 넘겨도 같은 해면 연도를 빼고 쓴다", () => {
    expect(formatTripDates("2026-05-31", "2026-06-01")).toBe("2026.05.31 ~ 06.01");
  });

  it("LOGIC-48 해를 넘기면 종료일에도 연도를 쓴다", () => {
    expect(formatTripDates("2025-12-31", "2026-01-01")).toBe("2025.12.31 ~ 2026.01.01");
  });
});
