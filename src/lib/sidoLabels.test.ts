import codes from "../../public/data/codes.json";
import { SIDO_LABELS } from "@/lib/sidoLabels";

// 시·도 이름 (TEST_CASES 3-5). 진짜 코드 목록 파일과 맞는지 본다
describe("SIDO_LABELS", () => {
  it("LOGIC-119 시·도(지역 코드 앞 두 자리)마다 이름이 정확히 하나씩 있고, 빈 이름이 없다", () => {
    const sidoCodes = [...new Set(codes.regions.map((region) => region.code.slice(0, 2)))].sort();
    const labelCodes = SIDO_LABELS.map((label) => label.sidoCode).sort();

    expect(sidoCodes).toHaveLength(16);
    // 빠진 시·도도, 두 번 나온 시·도도 없다
    expect(labelCodes).toEqual(sidoCodes);
    for (const label of SIDO_LABELS) expect(label.text.trim()).not.toBe("");
  });
});
