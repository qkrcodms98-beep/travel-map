import codes from "../../public/data/codes.json";

// 구가 있는 일반 시의 합친 코드 (2026-10-01판)
const MERGED_CITY_CODES = [
  "41110", // 수원시
  "41130", // 성남시
  "41170", // 안양시
  "41190", // 부천시
  "41270", // 안산시
  "41280", // 고양시
  "41460", // 용인시
  "41590", // 화성시
  "43110", // 청주시
  "44130", // 천안시
  "47110", // 포항시
  "48120", // 창원시
  "52110", // 전주시
];

// 코드 목록 파일 전체 확인 (TEST_CASES 3-8)
describe("코드 목록 파일 (public/data/codes.json)", () => {
  const regionCodes = codes.regions.map((region) => region.code);

  it("LOGIC-88 시·군·구 코드가 겹치지 않는다", () => {
    expect(new Set(regionCodes).size).toBe(regionCodes.length);
  });

  it.each(MERGED_CITY_CODES)("LOGIC-88 구가 있는 시 %s는 시 하나로만 있다", (cityCode) => {
    const sameCity = regionCodes.filter((code) => code.slice(0, 4) === cityCode.slice(0, 4));
    expect(sameCity).toEqual([cityCode]);
  });
});
