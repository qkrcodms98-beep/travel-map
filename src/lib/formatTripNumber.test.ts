import { formatTripNumber } from "@/lib/formatTripNumber";

// 여행 번호 글자 (TEST_CASES 3-5)
describe("formatTripNumber", () => {
  it('LOGIC-40 1이면 "첫 번째 여행"', () => {
    expect(formatTripNumber(1)).toBe("첫 번째 여행");
  });

  it('LOGIC-41 2이면 "두 번째 여행"', () => {
    expect(formatTripNumber(2)).toBe("두 번째 여행");
  });

  // 열 번째까지는 한글로 쓴다
  it('LOGIC-42 10이면 "열 번째 여행"', () => {
    expect(formatTripNumber(10)).toBe("열 번째 여행");
  });

  // 11번째부터는 숫자로 쓴다
  it('LOGIC-43 11이면 "11번째 여행"', () => {
    expect(formatTripNumber(11)).toBe("11번째 여행");
  });
});
