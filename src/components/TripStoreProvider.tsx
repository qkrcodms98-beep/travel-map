"use client";

import { createContext, useContext, useState } from "react";
import { apiTripStore } from "@/lib/tripApi";
import { TripStoreError } from "@/lib/tripStoreError";
import type { TripStore } from "@/types/trip";

// 부품들은 지금처럼 이 파일에서 가져다 쓴다 (COMPONENT_SPEC 3-1)
export { TripStoreError };
export type { TripStore };

const TripStoreContext = createContext<TripStore | null>(null);

interface TripStoreProviderProps {
  children: React.ReactNode;
  // 쓸 저장소. 빼면 FastAPI 백엔드를 부르는 저장소 (v0.2~). 테스트에서는 메모리 저장소를 넣는다
  store?: TripStore;
}

export function TripStoreProvider({ children, store = apiTripStore }: TripStoreProviderProps) {
  // 처음 받은 저장소를 계속 쓴다. 화면이 다시 그려져도 기록이 그대로 남는다
  const [currentStore] = useState(store);

  return <TripStoreContext.Provider value={currentStore}>{children}</TripStoreContext.Provider>;
}

// 부품이 저장소를 꺼내 쓰는 함수
export function useTripStore(): TripStore {
  const store = useContext(TripStoreContext);
  if (!store) throw new Error("useTripStore는 TripStoreProvider 안에서만 쓸 수 있어요.");
  return store;
}
