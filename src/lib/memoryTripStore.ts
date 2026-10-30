import { DONG_REGIONS } from "@/lib/dongCodes";
import { REGION_CODES } from "@/lib/regionCodes";
import { TripStoreError } from "@/lib/tripStoreError";
import { validateNewTrip, validateTripUpdate } from "@/lib/tripRules";
import type { Trip, TripStore } from "@/types/trip";

// 브라우저 메모리 저장소 (v0.1). 새로고침하면 사라진다. v0.2부터는 테스트에서만 쓴다
export function createMemoryTripStore(): TripStore {
  let trips: Trip[] = [];

  // 없는 여행이면 API와 같게 TRIP_NOT_FOUND (수정·삭제 공통, 내용 검사보다 먼저)
  function findTripOrThrow(id: string): Trip {
    const trip = trips.find((saved) => saved.id === id);
    if (!trip) throw new TripStoreError("TRIP_NOT_FOUND");
    return trip;
  }

  return {
    async listTrips(regionCode) {
      return regionCode ? trips.filter((trip) => trip.regionCode === regionCode) : [...trips];
    },

    async createTrip(input) {
      const now = new Date();
      const result = validateNewTrip(input, { now, regionCodes: REGION_CODES, dongRegions: DONG_REGIONS });
      if (!result.success) throw new TripStoreError(result.code);
      const savedAt = now.toISOString();
      const trip: Trip = { ...result.data, id: crypto.randomUUID(), createdAt: savedAt, updatedAt: savedAt };
      trips = [...trips, trip];
      return trip;
    },

    async updateTrip(id, input) {
      const old = findTripOrThrow(id);
      const now = new Date();
      const result = validateTripUpdate(input, { now, dongs: { regionCode: old.regionCode, dongRegions: DONG_REGIONS } });
      if (!result.success) throw new TripStoreError(result.code);
      const updated: Trip = { ...old, ...result.data, updatedAt: now.toISOString() };
      trips = trips.map((trip) => (trip.id === id ? updated : trip));
      return updated;
    },

    async deleteTrip(id) {
      findTripOrThrow(id);
      trips = trips.filter((trip) => trip.id !== id);
    },
  };
}
