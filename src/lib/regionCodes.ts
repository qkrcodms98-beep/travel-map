import codes from "../../public/data/codes.json";
import type { RegionCode } from "@/types/region";

// 코드 목록 파일(public/data/codes.json)의 시·군·구를 읽는 곳을 한 군데로 모은다

// 시·군·구 코드 모음 (지역 검사용)
export const REGION_CODES: ReadonlySet<RegionCode> = new Set(codes.regions.map((region) => region.code));

// 지역 이름. 코드 목록에 없는 지역이면 undefined
export function getRegionName(regionCode: RegionCode): string | undefined {
  return codes.regions.find((region) => region.code === regionCode)?.name;
}
