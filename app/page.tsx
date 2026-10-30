"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { CompletionBadge } from "@/components/CompletionBadge";
import { MapView, type RegionFeature } from "@/components/MapView";
import { useMapViewport } from "@/components/MapViewportProvider";
import { StatusMessage } from "@/components/StatusMessage";
import { useTripStore } from "@/components/TripStoreProvider";
import { calcCompletion } from "@/lib/calcCompletion";
import { countVisits } from "@/lib/countVisits";
import { REGION_AREAS } from "@/lib/regionAreas";
import type { RegionCode } from "@/types/region";
import type { Trip } from "@/types/trip";

type RegionsTopology = Topology<{ regions: GeometryCollection<{ code: RegionCode; name: string }> }>;

// 지도 파일 상태: 불러오는 중 / 실패 / 다 불러옴
type MapState = { status: "loading" } | { status: "error" } | { status: "ready"; regions: RegionFeature[] };

// 시·군·구 지도 파일을 불러와 MapView가 쓰는 모양으로 바꾼다 (COMPONENT_SPEC 3-2-2)
async function fetchRegions(): Promise<RegionFeature[]> {
  const response = await fetch("/data/regions.topo.json");
  if (!response.ok) throw new Error("지도 파일을 불러오지 못했어요.");
  const topology = (await response.json()) as RegionsTopology;
  return feature(topology, topology.objects.regions).features.map((region) => ({
    code: region.properties.code,
    name: region.properties.name,
    geometry: region.geometry,
  }));
}

// 첫 화면: 전국 지도
export default function HomePage() {
  const router = useRouter();
  const store = useTripStore();
  const { viewport, setViewport } = useMapViewport();
  const [map, setMap] = useState<MapState>({ status: "loading" });
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [tripsFailed, setTripsFailed] = useState(false);

  const loadMap = useCallback(() => {
    setMap({ status: "loading" });
    fetchRegions()
      .then((regions) => setMap({ status: "ready", regions }))
      .catch(() => setMap({ status: "error" }));
  }, []);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  // 여행 목록. 못 불러오면 지도는 빈 상태로 두고 안내를 보여 준다 (v0.2~)
  const loadTrips = useCallback(() => {
    setTripsFailed(false);
    store
      .listTrips()
      .then(setTrips)
      .catch(() => setTripsFailed(true));
  }, [store]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const visitCounts = countVisits(trips ?? []);

  return (
    <main className="min-h-screen">
      {/* 여행 목록을 다 불러온 뒤에만 보여 준다 (COMPONENT_SPEC 3-3) */}
      {trips && <CompletionBadge percent={calcCompletion(Object.keys(visitCounts), REGION_AREAS)} />}
      {map.status === "loading" && <StatusMessage kind="loading" message="지도를 불러오는 중이에요…" />}
      {map.status === "error" && (
        <StatusMessage kind="error" message="지도를 불러오지 못했어요." actionLabel="다시 시도" onAction={loadMap} />
      )}
      {map.status === "ready" && (
        <MapView
          regions={map.regions}
          visitCounts={visitCounts}
          onRegionClick={(regionCode) => router.push(`/regions/${regionCode}`)}
          viewport={viewport}
          onViewportChange={setViewport}
        />
      )}
      {tripsFailed && (
        <StatusMessage
          kind="error"
          message="여행 기록을 불러오지 못했어요. 지도는 빈 상태로 보여요."
          actionLabel="다시 시도"
          onAction={loadTrips}
        />
      )}
      {trips?.length === 0 && <StatusMessage kind="empty" message="다녀온 지역을 눌러 첫 여행을 기록해 보세요." />}
    </main>
  );
}
