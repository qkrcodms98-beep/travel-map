import { formatTripLength } from "@/lib/formatTripLength";

// 여행 기간 글자 (TEST_CASES 3-5)
describe("formatTripLength", () => {
  it('LOGIC-110 종료일이 없으면 "당일치기"', () => {
    expect(formatTripLength("2026-05-03", null)).toBe("당일치기");
  });

  it('LOGIC-111 종료일이 시작일과 같으면 "당일치기"', () => {
    expect(formatTripLength("2026-05-03", "2026-05-03")).toBe("당일치기");
  });

  it('LOGIC-112 3월 3일 ~ 5일이면 "2박 3일"', () => {
    expect(formatTripLength("2026-03-03", "2026-03-05")).toBe("2박 3일");
  });

  it('LOGIC-113 해를 넘겨도 "1박 2일"', () => {
    expect(formatTripLength("2025-12-31", "2026-01-01")).toBe("1박 2일");
  });

  it('LOGIC-114 2월 끝에서 3월로 넘어가도 "1박 2일"', () => {
    expect(formatTripLength("2026-02-28", "2026-03-01")).toBe("1박 2일");
  });
});
