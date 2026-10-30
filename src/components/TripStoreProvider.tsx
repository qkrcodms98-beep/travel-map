"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { REGION_CODES } from "@/lib/regionCodes";
import { validateNewTrip, validateTripUpdate } from "@/lib/tripRules";
import type { RegionCode } from "@/types/region";
import type { NewTrip, Trip, TripInput } from "@/types/trip";

// 여행 기록을 읽고 쓰는 함수 모음 (COMPONENT_SPEC 3-1)
export interface TripStore {
  listTrips(regionCode?: RegionCode): Promise<Trip[]>;
  createTrip(input: NewTrip): Promise<Trip>;
  updateTrip(id: string, input: TripInput): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
}

// 저장소 함수가 실패하면 던지는 에러. code는 API_SPEC 2장의 에러 코드
export class TripStoreError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = "TripStoreError";
    this.code = code;
  }
}

const TripStoreContext = createContext<TripStore | null>(null);

interface TripStoreProviderProps {
  children: React.ReactNode;
}

// v0.1: 브라우저 메모리에 저장한다. 새로고침하면 사라진다
export function TripStoreProvider({ children }: TripStoreProviderProps) {
  // 화면이 다시 그려져도 기록이 남게 ref에 둔다
  const tripsRef = useRef<Trip[]>([]);

  const store = useMemo<TripStore>(() => {
    // 없는 여행이면 API와 같게 TRIP_NOT_FOUND (수정·삭제 공통, 내용 검사보다 먼저)
    function findTripOrThrow(id: string): Trip {
      const trip = tripsRef.current.find((saved) => saved.id === id);
      if (!trip) throw new TripStoreError("TRIP_NOT_FOUND");
      return trip;
    }

    return {
      async listTrips(regionCode) {
        const trips = tripsRef.current;
        return regionCode ? trips.filter((trip) => trip.regionCode === regionCode) : [...trips];
      },

      async createTrip(input) {
        const now = new Date();
        const result = validateNewTrip(input, { now, regionCodes: REGION_CODES });
        if (!result.success) throw new TripStoreError(result.code);
        const savedAt = now.toISOString();
        const trip: Trip = { ...result.data, id: crypto.randomUUID(), createdAt: savedAt, updatedAt: savedAt };
        tripsRef.current = [...tripsRef.current, trip];
        return trip;
      },

      async updateTrip(id, input) {
        const old = findTripOrThrow(id);
        const now = new Date();
        const result = validateTripUpdate(input, { now });
        if (!result.success) throw new TripStoreError(result.code);
        const updated: Trip = { ...old, ...result.data, updatedAt: now.toISOString() };
        tripsRef.current = tripsRef.current.map((trip) => (trip.id === id ? updated : trip));
        return updated;
      },

      async deleteTrip(id) {
        findTripOrThrow(id);
        tripsRef.current = tripsRef.current.filter((trip) => trip.id !== id);
      },
    };
  }, []);

  return <TripStoreContext.Provider value={store}>{children}</TripStoreContext.Provider>;
}

// 부품이 저장소를 꺼내 쓰는 함수
export function useTripStore(): TripStore {
  const store = useContext(TripStoreContext);
  if (!store) throw new Error("useTripStore는 TripStoreProvider 안에서만 쓸 수 있어요.");
  return store;
}
