// 테스트용 가짜 코드 목록 (TEST_CASES 2장). public/data/codes.json과 같은 모양이다
export const FAKE_CODES = {
  version: "test",
  regions: [
    { code: "99010", name: "테스트시 가구" },
    { code: "99020", name: "테스트시 나구" },
  ],
  dongs: [
    { code: "9901010100", name: "가동", regionCode: "99010" },
    { code: "9901010200", name: "나동", regionCode: "99010" },
    { code: "9902010100", name: "다동", regionCode: "99020" },
  ],
};

// 가짜 지역 코드 모음 (A, B)
export const FAKE_REGION_CODES: ReadonlySet<string> = new Set(FAKE_CODES.regions.map((region) => region.code));
