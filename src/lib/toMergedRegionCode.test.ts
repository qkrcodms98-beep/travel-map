import { toMergedRegionCode } from "@/lib/toMergedRegionCode";

// 구 합치기 규칙 (DATA_MODEL 3장, TEST_CASES 3-8)
describe("toMergedRegionCode", () => {
  // 일반 시의 구는 "앞 4자리 + 0"인 시 코드로 합친다
  it("LOGIC-80 수원시 장안구 41111은 수원시 41110으로 합친다", () => {
    expect(toMergedRegionCode("41111")).toBe("41110");
  });

  it("LOGIC-81 부천시 오정구 41196은 부천시 41190으로 합친다", () => {
    expect(toMergedRegionCode("41196")).toBe("41190");
  });

  it("LOGIC-82 전주시 완산구 52111은 전주시 52110으로 합친다", () => {
    expect(toMergedRegionCode("52111")).toBe("52110");
  });

  // 끝자리가 0이 아니지만 군이라서 합치지 않는 예외
  it("LOGIC-83 증평군 43745는 그대로 둔다 (진천군 43740에 합치지 않는다)", () => {
    expect(toMergedRegionCode("43745")).toBe("43745");
  });

  it("LOGIC-84 태안군 44825는 그대로 둔다", () => {
    expect(toMergedRegionCode("44825")).toBe("44825");
  });

  // 특별시·광역시의 구는 끝자리가 0이 아니어도 그대로 둔다
  it("LOGIC-85 서울 광진구 11215는 그대로 둔다", () => {
    expect(toMergedRegionCode("11215")).toBe("11215");
  });

  it("LOGIC-86 인천 미추홀구 28177은 그대로 둔다", () => {
    expect(toMergedRegionCode("28177")).toBe("28177");
  });

  // 군위군은 대구 소속이고 끝자리가 0이라 그대로 둔다
  it("LOGIC-87 대구 군위군 27720은 그대로 둔다", () => {
    expect(toMergedRegionCode("27720")).toBe("27720");
  });
});
