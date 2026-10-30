"use client";

import { useEffect, useState } from "react";
import { useTripStore } from "@/components/TripStoreProvider";
import { assignTripNumbers } from "@/lib/assignTripNumbers";
import type { RegionCode } from "@/types/region";
import type { TripWithNumber } from "@/types/trip";

// 주소의 지역·여행 id로 번호 붙은 여행 하나를 찾는다 (여행 상세·수정 화면 공통, COMPONENT_SPEC 3-11-1)
// 불러오는 중이면 undefined, 찾지 못하면 null
export function useRegionTrip(regionCode: RegionCode, tripId: string): TripWithNumber | null | undefined {
  const store = useTripStore();
  const [trip, setTrip] = useState<TripWithNumber | null | undefined>(undefined);

  useEffect(() => {
    store.listTrips(regionCode).then((saved) => {
      // 번호는 그 지역의 목록 전체로 매긴다
      setTrip(assignTripNumbers(saved).find((found) => found.id === tripId) ?? null);
    });
  }, [store, regionCode, tripId]);

  return trip;
}
