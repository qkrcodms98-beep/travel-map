import type { DateString } from "@/types/trip";

const DAY_MS = 24 * 60 * 60 * 1000;

// 여행 기간 글자: "당일치기" 또는 "2박 3일" (COMPONENT_SPEC 4장)
export function formatTripLength(startDate: DateString, endDate: DateString | null): string {
  if (endDate === null || endDate === startDate) return "당일치기";
  // "YYYY-MM-DD"는 세계 표준시 0시로 읽혀서, 서머타임 같은 시간 차이 없이 날짜만 뺄 수 있다
  const nights = Math.round((Date.parse(endDate) - Date.parse(startDate)) / DAY_MS);
  return `${nights}박 ${nights + 1}일`;
}
