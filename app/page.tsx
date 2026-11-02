"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { feature, mesh } from "topojson-client";
import type { MultiLineString } from "geojson";
import type { GeometryCollection, GeometryObject, Topology } from "topojson-specification";
import { CompletionBadge } from "@/components/CompletionBadge";
import { MapView, type RegionFeature } from "@/components/MapView";
import { useMapViewport } from "@/components/MapViewportProvider";
import { StatusMessage } from "@/components/StatusMessage";
import { useTripStore } from "@/components/TripStoreProvider";
import { calcCompletion } from "@/lib/calcCompletion";
import { countVisits } from "@/lib/countVisits";
import { REGION_AREAS } from "@/lib/regionAreas";
import { REGION_CODES } from "@/lib/regionCodes";
import { SIDO_LABELS } from "@/lib/sidoLabels";
import type { RegionCode } from "@/types/region";
import type { Trip } from "@/types/trip";

type RegionProperties = { code: RegionCode; name: string };
type RegionsTopology = Topology<{ regions: GeometryCollection<RegionProperties> }>;

// 불러온 지도: 지역 모양 + 시·도 경계선
interface MapData {
  regions: RegionFeature[];
  sidoBorders: MultiLineString;
}

// 지도 파일 상태: 불러오는 중 / 실패 / 다 불러옴
type MapState = { status: "loading" } | { status: "error" } | ({ status: "ready" } & MapData);

// 시·군·구 지도 파일을 불러와 MapView가 쓰는 모양으로 바꾼다 (COMPONENT_SPEC 3-2-2)
async function fetchRegions(): Promise<MapData> {
  const response = await fetch("/data/regions.topo.json");
  if (!response.ok) throw new Error("지도 파일을 불러오지 못했어요.");
  const topology = (await response.json()) as RegionsTopology;
  const regions = feature(topology, topology.objects.regions).features.map((region) => ({
    code: region.properties.code,
    name: region.properties.name,
    geometry: region.geometry,
  }));
  // 시·도 경계선: 지역 코드 앞 두 자리(시·도)가 다른 이웃 사이의 선만 (COMPONENT_SPEC 10-6)
  // (topojson 타입은 속성 모양을 모르므로, 우리 지도 파일의 속성 모양으로 알려 준다)
  const sidoOf = (region: GeometryObject) => (region.properties as RegionProperties | undefined)?.code.slice(0, 2);
  const sidoBorders = mesh(topology, topology.objects.regions, (a, b) => a !== b && sidoOf(a) !== sidoOf(b));
  return { regions, sidoBorders };
}

// 숫자 카드 하나: 작은 이름 + 큰 숫자 (COMPONENT_SPEC 10-5)
function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-3xl bg-surface px-4 py-3">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">
        {value}
        <small className="text-[13px] font-medium text-muted">{unit}</small>
      </p>
    </div>
  );
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
      .then((data) => setMap({ status: "ready", ...data }))
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
    <main>
      {/* 앱 이름과 부제 (COMPONENT_SPEC 10-5) */}
      <div className="pt-6 pb-4">
        <h1 className="text-[28px] font-bold tracking-tight">트레이스</h1>
        <p className="text-[15px] text-muted">나만의 여행 지도</p>
      </div>
      {/* 숫자 카드는 여행 목록을 다 불러온 뒤에만 보여 준다 (COMPONENT_SPEC 3-3, 10-5) */}
      {trips && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StatCard
            label="다녀온 시·군·구"
            value={String(Object.keys(visitCounts).length)}
            unit={` / ${REGION_CODES.size}`}
          />
          <StatCard label="여행" value={String(trips.length)} unit="번" />
          <div className="col-span-2">
            <CompletionBadge percent={calcCompletion(Object.keys(visitCounts), REGION_AREAS)} />
          </div>
        </div>
      )}
      {/* 지도 카드: 바다색 둥근 상자 (가로:세로 = 3:4) */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sea">
        {map.status === "loading" && (
          <div className="absolute inset-0 grid place-items-center">
            <StatusMessage kind="loading" message="지도를 불러오는 중이에요…" />
          </div>
        )}
        {map.status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-4">
            <StatusMessage kind="error" message="지도를 불러오지 못했어요." actionLabel="다시 시도" onAction={loadMap} />
          </div>
        )}
        {map.status === "ready" && (
          <MapView
            regions={map.regions}
            sidoBorders={map.sidoBorders}
            labels={SIDO_LABELS}
            visitCounts={visitCounts}
            onRegionClick={(regionCode) => router.push(`/regions/${regionCode}`)}
            viewport={viewport}
            onViewportChange={setViewport}
          />
        )}
      </div>
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
