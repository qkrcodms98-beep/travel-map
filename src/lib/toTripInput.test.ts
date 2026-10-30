import { toTripInput } from "@/lib/toTripInput";
import type { TripFormValue } from "@/types/trip";

// 폼 값 (시작일만 넣은 상태)
const FORM: TripFormValue = { startDate: "2026-05-03", endDate: "", diary: "", dongCodes: [] };

// 폼 값 → 저장할 값 (TEST_CASES 3-7)
describe("toTripInput", () => {
  it('LOGIC-70 종료일 ""은 null이 된다', () => {
    expect(toTripInput(FORM).endDate).toBeNull();
  });

  it('LOGIC-71 종료일 "2026-05-04"는 그대로다', () => {
    expect(toTripInput({ ...FORM, endDate: "2026-05-04" }).endDate).toBe("2026-05-04");
  });

  // 바꾸지 않고 두어야 검사에서 START_DATE_REQUIRED로 걸린다
  it('LOGIC-72 시작일 ""은 그대로 ""이다', () => {
    expect(toTripInput({ ...FORM, startDate: "" }).startDate).toBe("");
  });
});
