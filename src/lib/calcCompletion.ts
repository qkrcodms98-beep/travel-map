import type { RegionCode } from "@/types/region";

// 지도 완성도(%) = 가 본 시·군·구 넓이 ÷ 전체 땅 넓이 × 100 (COMPONENT_SPEC 4장)
// 모든 지역을 가 봤으면 나눗셈 없이 정확히 100을 돌려준다 (소수 계산 오차로 99.99…가 되지 않게)
export function calcCompletion(visitedRegionCodes: RegionCode[], regionAreas: Record<RegionCode, number>): number {
  const visited = new Set(visitedRegionCodes); // 같은 지역은 한 번만 센다
  const allCodes = Object.keys(regionAreas);
  if (allCodes.length > 0 && allCodes.every((code) => visited.has(code))) return 100;

  let total = 0;
  let visitedArea = 0;
  for (const code of allCodes) {
    total += regionAreas[code];
    if (visited.has(code)) visitedArea += regionAreas[code];
  }
  return total === 0 ? 0 : (visitedArea / total) * 100;
}
