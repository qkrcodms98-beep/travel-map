import type { TripFormValue, TripInput } from "@/types/trip";

// 폼 값 → 저장할 값. 비운 종료일 ""만 null로 바꾸고, 시작일 ""은 검사에서 걸리게 그대로 둔다 (COMPONENT_SPEC 3-6)
export function toTripInput(value: TripFormValue): TripInput {
  return {
    startDate: value.startDate,
    endDate: value.endDate === "" ? null : value.endDate,
    diary: value.diary,
    dongCodes: value.dongCodes,
  };
}
