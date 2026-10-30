import type { RegionCode } from "@/types/region";

// 특별시·광역시·세종의 시·도 코드. 이 안의 구는 합치지 않는다
const METRO_SIDO_CODES: readonly string[] = ["11", "26", "27", "28", "29", "30", "31", "36"];

// 끝자리가 0이 아니지만 군이라서 합치지 않는 코드 (2026-10-01판 데이터 기준)
const COUNTY_EXCEPTIONS: readonly string[] = ["43745", "44825"]; // 증평군, 태안군

// 일반 시의 구 코드를 합친 시 코드(앞 4자리 + 0)로 바꾼다. 그 밖의 코드는 그대로 둔다 (DATA_MODEL 3장)
export function toMergedRegionCode(sggCode: string): RegionCode {
  const sidoCode = sggCode.slice(0, 2);
  const isGeneralCityGu =
    !METRO_SIDO_CODES.includes(sidoCode) &&
    !sggCode.endsWith("0") &&
    !COUNTY_EXCEPTIONS.includes(sggCode);

  return isGeneralCityGu ? `${sggCode.slice(0, 4)}0` : sggCode;
}
