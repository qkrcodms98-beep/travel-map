import { formatDongSummary } from "@/lib/formatDongSummary";

// 동네 요약 글자 (TEST_CASES 3-5)
describe("formatDongSummary", () => {
  it("LOGIC-115 동네가 없으면 null", () => {
    expect(formatDongSummary([])).toBeNull();
  });

  it('LOGIC-116 한 곳이면 "가동"', () => {
    expect(formatDongSummary(["가동"])).toBe("가동");
  });

  it("LOGIC-117 세 곳까지는 모두 쓴다", () => {
    expect(formatDongSummary(["가동", "나동", "다동"])).toBe("가동, 나동, 다동");
  });

  it('LOGIC-118 네 곳 이상이면 세 곳만 쓰고 "외 N곳"', () => {
    expect(formatDongSummary(["가동", "나동", "다동", "라동", "마동"])).toBe("가동, 나동, 다동 외 2곳");
  });
});
