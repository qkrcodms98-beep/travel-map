import type { DateString } from "@/types/trip";

// "2026-05-03" → "2026.05.03"
function toDots(date: DateString): string {
  return date.replaceAll("-", ".");
}

// 여행 날짜 글자. 당일치기, 같은 해, 해를 넘김을 나눠 쓴다 (COMPONENT_SPEC 4장)
// 당일치기는 날짜만 쓴다. "당일치기" 글자는 기간 글자(formatTripLength)에 있다
export function formatTripDates(startDate: DateString, endDate: DateString | null): string {
  if (endDate === null || endDate === startDate) {
    return toDots(startDate);
  }
  const isSameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  // 같은 해면 종료일의 연도("2026.")를 뺀다
  const endText = isSameYear ? toDots(endDate.slice(5)) : toDots(endDate);
  return `${toDots(startDate)} ~ ${endText}`;
}
