import type { Trip, TripFormValue } from "@/types/trip";

// 저장된 여행 → 폼 값. 입력 칸은 null을 담을 수 없어서 종료일 null을 ""로 바꾼다 (COMPONENT_SPEC 3-6)
export function toFormValue(trip: Trip): TripFormValue {
  return {
    startDate: trip.startDate,
    endDate: trip.endDate ?? "",
    diary: trip.diary,
    dongCodes: trip.dongCodes,
  };
}
