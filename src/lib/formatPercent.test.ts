import { formatPercent } from "@/lib/formatPercent";

// 지도 완성도 글자 (TEST_CASES 3-4). 소수 첫째 자리까지 버림
describe("formatPercent", () => {
  it('LOGIC-34 0 → "0%"', () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it('LOGIC-35 0.04 → "0.1% 미만"', () => {
    expect(formatPercent(0.04)).toBe("0.1% 미만");
  });

  it('LOGIC-36 0.1 → "0.1%"', () => {
    expect(formatPercent(0.1)).toBe("0.1%");
  });

  it('LOGIC-37 12.345 → "12.3%"', () => {
    expect(formatPercent(12.345)).toBe("12.3%");
  });

  it('LOGIC-38 25 → "25.0%"', () => {
    expect(formatPercent(25)).toBe("25.0%");
  });

  it('LOGIC-39 100 → "100%"', () => {
    expect(formatPercent(100)).toBe("100%");
  });

  it('LOGIC-96 12.39 → "12.3%" (반올림이 아니라 버림)', () => {
    expect(formatPercent(12.39)).toBe("12.3%");
  });

  it('LOGIC-97 99.96 → "99.9%" ("100.0%"나 "100%"가 아니다)', () => {
    expect(formatPercent(99.96)).toBe("99.9%");
  });

  it('LOGIC-98 0.09 → "0.1% 미만"', () => {
    expect(formatPercent(0.09)).toBe("0.1% 미만");
  });
});
