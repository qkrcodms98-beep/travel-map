"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { MapViewport } from "@/components/MapView";

interface MapViewportContextValue {
  viewport: MapViewport | null; // 아직 확대·이동한 적 없으면 null
  setViewport: (viewport: MapViewport) => void;
}

const MapViewportContext = createContext<MapViewportContextValue | null>(null);

interface MapViewportProviderProps {
  children: React.ReactNode;
}

// 지도 확대 상태를 기억한다. 화면을 옮겨도 남고, 새로고침하면 사라진다 (COMPONENT_SPEC 3-2-1)
export function MapViewportProvider({ children }: MapViewportProviderProps) {
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const value = useMemo(() => ({ viewport, setViewport }), [viewport]);
  return <MapViewportContext.Provider value={value}>{children}</MapViewportContext.Provider>;
}

export function useMapViewport(): MapViewportContextValue {
  const value = useContext(MapViewportContext);
  if (!value) throw new Error("useMapViewport는 MapViewportProvider 안에서만 쓸 수 있어요.");
  return value;
}
