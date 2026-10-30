import { toFormValue } from "@/lib/toFormValue";
import { toTripInput } from "@/lib/toTripInput";
import { T1, T2 } from "../../tests/fixtures/trips";

// 저장된 여행 → 폼 값 (TEST_CASES 3-7)
describe("toFormValue", () => {
  it('LOGIC-73 종료일 null인 T2는 종료일 ""이 된다', () => {
    expect(toFormValue(T2)).toEqual({ startDate: "2026-06-01", endDate: "", diary: "", dongCodes: [] });
  });

  it("LOGIC-74 T1을 폼 값으로 바꿨다가 되돌리면 날짜, 일기, 동네가 T1과 같다", () => {
    expect(toTripInput(toFormValue(T1))).toEqual({
      startDate: T1.startDate,
      endDate: T1.endDate,
      diary: T1.diary,
      dongCodes: T1.dongCodes,
    });
  });
});
