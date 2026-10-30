import { countDiaryChars } from "@/lib/countDiaryChars";
import { validateNewTrip, validateTripUpdate } from "@/lib/tripRules";
import { FAKE_REGION_CODES } from "../../tests/fixtures/codes";

// countDiaryChars는 진짜로 동작하게 두고, 불렸는지만 볼 수 있게 감싼다 (VAL-37)
jest.mock("@/lib/countDiaryChars", () => {
  const actual = jest.requireActual<typeof import("@/lib/countDiaryChars")>("@/lib/countDiaryChars");
  return { ...actual, countDiaryChars: jest.fn(actual.countDiaryChars) };
});

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

// 정상 값 (TEST_CASES 4장). 테스트마다 여기서 한 칸만 바꾼다
const VALID_NEW = { regionCode: "99010", startDate: "2026-10-01", endDate: null, diary: "", dongCodes: [] };
const VALID_UPDATE = { startDate: "2026-10-01", endDate: null, diary: "", dongCodes: [] };

function checkNew(input: unknown, now: Date = NOW) {
  return validateNewTrip(input, { now, regionCodes: FAKE_REGION_CODES });
}

function checkUpdate(input: unknown, now: Date = NOW) {
  return validateTripUpdate(input, { now });
}

// 필드 하나를 뺀 복사본
function without(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

const fail = (code: string) => ({ success: false, code });

// 새 여행 규칙: 시작일 (TEST_CASES 4-1)
describe("validateNewTrip 시작일", () => {
  it("VAL-01 정상 값은 통과한다", () => {
    expect(checkNew(VALID_NEW)).toEqual({ success: true, data: VALID_NEW });
  });

  it("VAL-02 startDate 필드가 없으면 START_DATE_REQUIRED", () => {
    expect(checkNew(without(VALID_NEW, "startDate"))).toEqual(fail("START_DATE_REQUIRED"));
  });

  it("VAL-03 startDate가 null이면 START_DATE_REQUIRED", () => {
    expect(checkNew({ ...VALID_NEW, startDate: null })).toEqual(fail("START_DATE_REQUIRED"));
  });

  it("VAL-04 startDate가 빈 글자면 START_DATE_REQUIRED", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "" })).toEqual(fail("START_DATE_REQUIRED"));
  });

  it('VAL-05 "2026/05/03"은 INVALID_DATE', () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026/05/03" })).toEqual(fail("INVALID_DATE"));
  });

  it("VAL-06 없는 날짜 2026-02-30은 INVALID_DATE", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-02-30" })).toEqual(fail("INVALID_DATE"));
  });

  it("VAL-07 오늘(2026-10-29)은 시작일로 된다", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-29" }).success).toBe(true);
  });

  it("VAL-08 내일(2026-10-30)은 START_DATE_IN_FUTURE", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-30" })).toEqual(fail("START_DATE_IN_FUTURE"));
  });

  // UTC로는 아직 10-28이지만 한국은 10-29 새벽이다
  it("VAL-09 한국 10-29 새벽 00:30에는 2026-10-29가 막히지 않는다", () => {
    const now = new Date("2026-10-28T15:30:00Z");
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-29" }, now).success).toBe(true);
  });

  it("VAL-10 한국 10-29 23:59:59에는 2026-10-30이 START_DATE_IN_FUTURE", () => {
    const now = new Date("2026-10-29T14:59:59Z");
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-30" }, now)).toEqual(fail("START_DATE_IN_FUTURE"));
  });

  it("VAL-11 한국 10-30 00:00이 되면 2026-10-30이 통과한다", () => {
    const now = new Date("2026-10-29T15:00:00Z");
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-30" }, now).success).toBe(true);
  });
});

// 새 여행 규칙: 종료일 (TEST_CASES 4-2)
describe("validateNewTrip 종료일", () => {
  it("VAL-20 endDate 필드가 없으면 통과하고 당일치기(null)가 된다", () => {
    expect(checkNew(without(VALID_NEW, "endDate"))).toEqual({ success: true, data: { ...VALID_NEW, endDate: null } });
  });

  it("VAL-21 종료일이 시작일과 같은 날이면 통과한다", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-01", endDate: "2026-10-01" }).success).toBe(true);
  });

  it("VAL-22 종료일이 시작일보다 빠르면 END_DATE_BEFORE_START", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-02", endDate: "2026-10-01" })).toEqual(
      fail("END_DATE_BEFORE_START"),
    );
  });

  it("VAL-23 종료일은 미래여도 통과한다", () => {
    expect(checkNew({ ...VALID_NEW, startDate: "2026-10-29", endDate: "2026-10-30" }).success).toBe(true);
  });

  it('VAL-24 endDate "2026-13-01"은 INVALID_DATE', () => {
    expect(checkNew({ ...VALID_NEW, endDate: "2026-13-01" })).toEqual(fail("INVALID_DATE"));
  });
});

// 새 여행 규칙: 여행일기와 글자 수 (TEST_CASES 4-3)
describe("validateNewTrip 여행일기", () => {
  it('VAL-30 diary 필드가 없으면 통과하고 ""이 된다', () => {
    expect(checkNew(without(VALID_NEW, "diary"))).toEqual({ success: true, data: { ...VALID_NEW, diary: "" } });
  });

  it('VAL-31 "가" 2,000자는 통과한다', () => {
    expect(checkNew({ ...VALID_NEW, diary: "가".repeat(2000) }).success).toBe(true);
  });

  it('VAL-32 "가" 2,001자는 DIARY_TOO_LONG', () => {
    expect(checkNew({ ...VALID_NEW, diary: "가".repeat(2001) })).toEqual(fail("DIARY_TOO_LONG"));
  });

  it("VAL-33 😀 2,000개는 2,000자로 세어 통과한다", () => {
    expect(checkNew({ ...VALID_NEW, diary: "😀".repeat(2000) }).success).toBe(true);
  });

  it("VAL-34 😀 2,001개는 DIARY_TOO_LONG", () => {
    expect(checkNew({ ...VALID_NEW, diary: "😀".repeat(2001) })).toEqual(fail("DIARY_TOO_LONG"));
  });

  it('VAL-35 "가" 1,999자 + 😀 1개는 2,000자라 통과한다', () => {
    expect(checkNew({ ...VALID_NEW, diary: "가".repeat(1999) + "😀" }).success).toBe(true);
  });

  it('VAL-36 "가" 1,999자 + 😀 2개는 2,001자라 DIARY_TOO_LONG', () => {
    expect(checkNew({ ...VALID_NEW, diary: "가".repeat(1999) + "😀😀" })).toEqual(fail("DIARY_TOO_LONG"));
  });

  it('VAL-37 "가😀a"는 countDiaryChars로 3자로 세어 통과한다', () => {
    const counter = jest.mocked(countDiaryChars);
    counter.mockClear();
    expect(checkNew({ ...VALID_NEW, diary: "가😀a" }).success).toBe(true);
    expect(counter).toHaveBeenCalledWith("가😀a");
  });
});

// 새 여행 규칙: 지역과 동네 (TEST_CASES 4-4, v0.1 범위)
describe("validateNewTrip 지역과 동네", () => {
  it('VAL-40 regionCode "9901"(4자리)은 INVALID_REGION_CODE', () => {
    expect(checkNew({ ...VALID_NEW, regionCode: "9901" })).toEqual(fail("INVALID_REGION_CODE"));
  });

  it('VAL-41 regionCode "99999"(코드 목록에 없음)는 INVALID_REGION_CODE', () => {
    expect(checkNew({ ...VALID_NEW, regionCode: "99999" })).toEqual(fail("INVALID_REGION_CODE"));
  });

  // v0.3까지는 빈 목록만 받는다
  it("VAL-42 dongCodes에 값이 있으면 INVALID_DONG_CODE", () => {
    expect(checkNew({ ...VALID_NEW, dongCodes: ["9901010100"] })).toEqual(fail("INVALID_DONG_CODE"));
  });
});

// 모양과 검사 순서 (TEST_CASES 4-5)
describe("요청 모양과 검사 순서", () => {
  it('VAL-50 모르는 필드 "note"가 있으면 INVALID_REQUEST', () => {
    expect(checkNew({ ...VALID_NEW, note: "x" })).toEqual(fail("INVALID_REQUEST"));
  });

  it("VAL-51 diary가 숫자면 INVALID_REQUEST", () => {
    expect(checkNew({ ...VALID_NEW, diary: 123 })).toEqual(fail("INVALID_REQUEST"));
  });

  it("VAL-52 regionCode 필드가 없으면 INVALID_REQUEST", () => {
    expect(checkNew(without(VALID_NEW, "regionCode"))).toEqual(fail("INVALID_REQUEST"));
  });

  it("VAL-53 수정 규칙: 4개 필드가 모두 있으면 통과한다", () => {
    expect(checkUpdate(VALID_UPDATE)).toEqual({ success: true, data: VALID_UPDATE });
  });

  it("VAL-54 수정 규칙: diary 필드가 없으면 INVALID_REQUEST", () => {
    expect(checkUpdate(without(VALID_UPDATE, "diary"))).toEqual(fail("INVALID_REQUEST"));
  });

  it("VAL-55 수정 규칙: startDate 필드가 없으면 START_DATE_REQUIRED", () => {
    expect(checkUpdate(without(VALID_UPDATE, "startDate"))).toEqual(fail("START_DATE_REQUIRED"));
  });

  it("VAL-56 수정 규칙: regionCode를 보내면 INVALID_REQUEST", () => {
    expect(checkUpdate({ ...VALID_UPDATE, regionCode: "99010" })).toEqual(fail("INVALID_REQUEST"));
  });

  it("VAL-57 시작일 없음 + 일기 2,001자면 먼저 걸린 START_DATE_REQUIRED만", () => {
    const input = { ...without(VALID_NEW, "startDate"), diary: "가".repeat(2001) };
    expect(checkNew(input)).toEqual(fail("START_DATE_REQUIRED"));
  });

  it("VAL-58 시작일이 미래 + 종료일이 시작일보다 빠르면 START_DATE_IN_FUTURE", () => {
    const input = { ...VALID_NEW, startDate: "2026-10-30", endDate: "2026-10-01" };
    expect(checkNew(input)).toEqual(fail("START_DATE_IN_FUTURE"));
  });

  it("VAL-59 종료일이 시작일보다 빠름 + 일기 2,001자면 END_DATE_BEFORE_START", () => {
    const input = { ...VALID_NEW, startDate: "2026-10-02", endDate: "2026-10-01", diary: "가".repeat(2001) };
    expect(checkNew(input)).toEqual(fail("END_DATE_BEFORE_START"));
  });
});
