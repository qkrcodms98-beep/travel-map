import type { RegionCode } from "@/types/region";
import type { Trip } from "@/types/trip";

// 지역별 여행 개수를 센다. 여행이 없는 지역은 결과에 넣지 않는다 (COMPONENT_SPEC 4장)
export function countVisits(trips: Trip[]): Record<RegionCode, number> {
  const counts: Record<RegionCode, number> = {};
  for (const trip of trips) {
    counts[trip.regionCode] = (counts[trip.regionCode] ?? 0) + 1;
  }
  return counts;
}
