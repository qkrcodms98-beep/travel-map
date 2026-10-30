import { calcCompletion } from "@/lib/calcCompletion";
import { formatPercent } from "@/lib/formatPercent";
import { FAKE_REGION_AREAS } from "../../tests/fixtures/areas";

// 지도 완성도 (TEST_CASES 3-4). A 넓이 1, B 넓이 3
describe("calcCompletion", () => {
  it("LOGIC-30 가 본 곳이 없으면 0", () => {
    expect(calcCompletion([], FAKE_REGION_AREAS)).toBe(0);
  });

  it("LOGIC-31 A만 가 보면 25", () => {
    expect(calcCompletion(["99010"], FAKE_REGION_AREAS)).toBe(25);
  });

  it("LOGIC-32 모든 지역을 가 보면 정확히 100", () => {
    expect(calcCompletion(["99010", "99020"], FAKE_REGION_AREAS) === 100).toBe(true);
  });

  it("LOGIC-33 같은 지역을 두 번 넣어도 한 번만 센다", () => {
    expect(calcCompletion(["99010", "99010"], FAKE_REGION_AREAS)).toBe(25);
  });

  it('LOGIC-99 A=1, B=9999에서 B만 가 보면 99.99 → "99.9%" (100%로 보이지 않는다)', () => {
    const percent = calcCompletion(["99020"], { "99010": 1, "99020": 9999 });
    expect(percent).toBeCloseTo(99.99, 10);
    expect(formatPercent(percent)).toBe("99.9%");
  });
});
