import codes from "../../public/data/codes.json";
import type { DongCode, DongOption, RegionCode } from "@/types/region";

// 코드 목록 파일(public/data/codes.json)의 동네를 읽는 곳을 한 군데로 모은다 (v0.4)

// 동네 코드 → 그 동네가 속한 시·군·구 코드 (동네 검사용)
export const DONG_REGIONS: ReadonlyMap<DongCode, RegionCode> = new Map(
  codes.dongs.map((dong) => [dong.code, dong.regionCode]),
);

// 그 지역의 동네 (코드 목록 파일 순서)
export function getDongOptions(regionCode: RegionCode): DongOption[] {
  return codes.dongs.filter((dong) => dong.regionCode === regionCode).map(({ code, name }) => ({ code, name }));
}

const DONG_NAMES: ReadonlyMap<DongCode, string> = new Map(codes.dongs.map((dong) => [dong.code, dong.name]));

// 동네 코드 → 이름. 목록에 없는 코드는 뺀다
export function getDongNames(dongCodes: DongCode[]): string[] {
  return dongCodes.flatMap((code) => DONG_NAMES.get(code) ?? []);
}
