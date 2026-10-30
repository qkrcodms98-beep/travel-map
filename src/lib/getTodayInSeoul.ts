import type { DateString } from "@/types/trip";

// 한국 시간은 UTC보다 9시간 빠르다 (서머타임 없음)
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

// 지금 시각의 한국 날짜 "YYYY-MM-DD". 테스트할 수 있게 지금 시각을 넣어 받는다 (COMPONENT_SPEC 4장)
export function getTodayInSeoul(now: Date): DateString {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}
