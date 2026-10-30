import { z } from "zod";
import { countDiaryChars } from "@/lib/countDiaryChars";
import { getTodayInSeoul } from "@/lib/getTodayInSeoul";
import type { RegionCode } from "@/types/region";
import type { DateString, NewTrip, TripInput } from "@/types/trip";

const DIARY_MAX_CHARS = 2000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REGION_CODE_PATTERN = /^\d{5}$/;

// 입력 규칙이 돌려주는 에러 코드 (API_SPEC 2장)
export type TripRuleErrorCode =
  | "INVALID_REQUEST"
  | "START_DATE_REQUIRED"
  | "INVALID_DATE"
  | "START_DATE_IN_FUTURE"
  | "END_DATE_BEFORE_START"
  | "DIARY_TOO_LONG"
  | "INVALID_REGION_CODE"
  | "INVALID_DONG_CODE";

type TripRuleFailure = { success: false; code: TripRuleErrorCode };

// 검사 결과. 통과하면 빠진 값을 채운 data, 실패하면 먼저 걸린 에러 코드 하나
export type TripRuleResult<T> = { success: true; data: T } | TripRuleFailure;

function fail(code: TripRuleErrorCode): TripRuleFailure {
  return { success: false, code };
}

// 단계 번호는 API_SPEC 5장의 검사 순서다
// 1단계: 모양 검사. 모르는 필드는 막고(strict), 시작일은 비어 있어도 여기서는 통과시킨다 (2단계에서 거른다)
const startDateShape = z.string().nullable().optional();

const newTripShape = z.strictObject({
  regionCode: z.string(),
  startDate: startDateShape,
  endDate: z.string().nullable().optional(),
  diary: z.string().optional(),
  dongCodes: z.array(z.string()).optional(),
});

// 수정은 4개 필드가 모두 있어야 한다 (일기·동네가 몰래 지워지지 않게)
const tripUpdateShape = z.strictObject({
  startDate: startDateShape,
  endDate: z.string().nullable(),
  diary: z.string(),
  dongCodes: z.array(z.string()),
});

// "YYYY-MM-DD" 모양이고 실제 있는 날짜인지. 2026-02-30은 Date가 3월로 넘겨 버려서 되돌린 글자가 달라진다
function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

// 3~6단계: 날짜와 일기 (새 여행·수정 공통)
function checkDatesAndDiary(
  startDate: DateString,
  endDate: DateString | null,
  diary: string,
  now: Date,
): TripRuleErrorCode | null {
  if (!isRealDate(startDate) || (endDate !== null && !isRealDate(endDate))) return "INVALID_DATE";
  if (startDate > getTodayInSeoul(now)) return "START_DATE_IN_FUTURE";
  if (endDate !== null && endDate < startDate) return "END_DATE_BEFORE_START";
  if (countDiaryChars(diary) > DIARY_MAX_CHARS) return "DIARY_TOO_LONG";
  return null;
}

// 새 여행 규칙
export function validateNewTrip(
  input: unknown,
  options: { now: Date; regionCodes: ReadonlySet<RegionCode> },
): TripRuleResult<NewTrip> {
  const shape = newTripShape.safeParse(input);
  if (!shape.success) return fail("INVALID_REQUEST");

  // 빠진 종료일·일기·동네는 기본값으로 채운다
  const { regionCode, startDate, endDate = null, diary = "", dongCodes = [] } = shape.data;
  // 2단계
  if (!startDate) return fail("START_DATE_REQUIRED");
  // 3~6단계
  const fieldError = checkDatesAndDiary(startDate, endDate, diary, options.now);
  if (fieldError) return fail(fieldError);
  // 7단계: 형식과 코드 목록 둘 다 본다
  if (!REGION_CODE_PATTERN.test(regionCode) || !options.regionCodes.has(regionCode)) {
    return fail("INVALID_REGION_CODE");
  }
  // 8단계: v0.3까지는 동네를 받지 않는다
  if (dongCodes.length > 0) return fail("INVALID_DONG_CODE");

  return { success: true, data: { regionCode, startDate, endDate, diary, dongCodes } };
}

// 수정 규칙. 지역은 받지 않으므로 7단계가 없다 (API_SPEC 3-3)
export function validateTripUpdate(input: unknown, options: { now: Date }): TripRuleResult<TripInput> {
  const shape = tripUpdateShape.safeParse(input);
  if (!shape.success) return fail("INVALID_REQUEST");

  const { startDate, endDate, diary, dongCodes } = shape.data;
  // 2단계
  if (!startDate) return fail("START_DATE_REQUIRED");
  // 3~6단계
  const fieldError = checkDatesAndDiary(startDate, endDate, diary, options.now);
  if (fieldError) return fail(fieldError);
  // 8단계: v0.3까지는 동네를 받지 않는다
  if (dongCodes.length > 0) return fail("INVALID_DONG_CODE");

  return { success: true, data: { startDate, endDate, diary, dongCodes } };
}
