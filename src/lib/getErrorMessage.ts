// 에러 코드별 화면 문구 (COMPONENT_SPEC 5장)
const ERROR_MESSAGES = new Map<string, string>([
  ["INVALID_REQUEST", "요청 형식이 올바르지 않아요. 새로고침한 뒤 다시 시도해 주세요."],
  ["START_DATE_REQUIRED", "시작일을 입력해 주세요."],
  ["INVALID_DATE", "날짜 형식이 올바르지 않아요."],
  ["START_DATE_IN_FUTURE", "시작일은 오늘까지만 고를 수 있어요."],
  ["END_DATE_BEFORE_START", "종료일은 시작일보다 빠를 수 없어요."],
  ["DIARY_TOO_LONG", "여행일기는 2,000자까지 쓸 수 있어요."],
  ["INVALID_REGION_CODE", "지역을 찾을 수 없어요. 지도에서 다시 골라 주세요."],
  ["INVALID_DONG_CODE", "동네 코드가 올바르지 않아요. 동네를 다시 골라 주세요."],
  ["DUPLICATE_DONG_CODE", "같은 동네를 두 번 고를 수 없어요."],
  ["TRIP_NOT_FOUND", "여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요."],
  ["INTERNAL_ERROR", "잠시 후 다시 시도해 주세요."],
]);

const UNKNOWN_ERROR_MESSAGE = "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";

// 에러 코드 → 화면 문구. 표에 없는 코드면 기본 문구를 돌려준다
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES.get(code) ?? UNKNOWN_ERROR_MESSAGE;
}
