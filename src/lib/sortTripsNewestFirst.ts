import { compareTripsOldestFirst } from "@/lib/assignTripNumbers";
import type { TripWithNumber } from "@/types/trip";

// 최신순으로 줄 세운다. 번호 매기기의 반대 순서라 맨 위가 가장 큰 번호다. 넣은 배열은 바꾸지 않는다 (COMPONENT_SPEC 4장)
export function sortTripsNewestFirst(trips: TripWithNumber[]): TripWithNumber[] {
  return [...trips].sort((a, b) => compareTripsOldestFirst(b, a));
}
