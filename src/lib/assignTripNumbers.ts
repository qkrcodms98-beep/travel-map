import type { Trip, TripWithNumber } from "@/types/trip";

// 오래된 순 비교: 시작일이 먼저, 시작일이 같으면 먼저 기록한 여행이 앞 (IDEA.md)
export function compareTripsOldestFirst(a: Trip, b: Trip): number {
  if (a.startDate !== b.startDate) {
    return a.startDate < b.startDate ? -1 : 1;
  }
  // 시각은 ".000Z"가 붙거나 안 붙을 수 있어서 글자 대신 숫자로 바꿔 비교한다
  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

// 한 지역의 여행에 오래된 순으로 1, 2, 3… 번호를 붙인다. 넣은 배열과 여행은 바꾸지 않는다 (COMPONENT_SPEC 4장)
export function assignTripNumbers(trips: Trip[]): TripWithNumber[] {
  return [...trips]
    .sort(compareTripsOldestFirst)
    .map((trip, index) => ({ ...trip, tripNumber: index + 1 }));
}
