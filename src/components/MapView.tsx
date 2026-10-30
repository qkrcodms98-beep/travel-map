"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  geoMercator,
  geoPath,
  select,
  zoom,
  zoomIdentity,
  zoomTransform,
  type D3ZoomEvent,
  type ZoomTransform,
} from "d3";
import type { Geometry } from "geojson";
import { getColorStage, type ColorStage } from "@/lib/getColorStage";
import { useTerrainImage } from "@/components/useTerrainImage";
import type { RegionCode } from "@/types/region";

// 확대 상태 (COMPONENT_SPEC 3-2)
export interface MapViewport {
  scale: number; // 확대 배율 (1 = 전국)
  x: number; // 옮긴 거리 (가로)
  y: number; // 옮긴 거리 (세로)
}

export interface RegionFeature {
  code: RegionCode;
  name: string; // 예: "대구광역시 군위군"
  geometry: Geometry;
}

export interface MapViewProps {
  regions: RegionFeature[];
  visitCounts: Record<RegionCode, number>;
  onRegionClick: (regionCode: RegionCode) => void;
  viewport: MapViewport | null; // null이면 전국이 보이게
  onViewportChange: (viewport: MapViewport) => void;
}

// 지도를 그리는 판의 크기 (화면에서는 가로 폭에 맞춰 늘고 준다)
const WIDTH = 600;
const HEIGHT = 800;
// 가장 크게 키우는 배율. 서울의 구를 손가락으로 누를 수 있을 만큼
const MAX_SCALE = 40;
// 마우스가 이만큼(px) 넘게 움직이면 누르기가 아니라 끌기로 본다
const DRAG_THRESHOLD = 3;

// 색칠 단계별 색: 흰색 / 연두색 / 진한 초록 (진한 초록은 지형 무늬 그림이 다 그려지기 전의 바탕)
const FILL: Record<ColorStage, string> = {
  none: "#ffffff",
  once: "#b7e4a0",
  many: "#2d6a4f",
};

// 지형 무늬 이름 (2번 이상 간 지역의 fill)
const TERRAIN_PATTERN_ID = "terrain-pattern";

// 우리 모양(MapViewport) ↔ d3 모양(ZoomTransform). null은 처음 상태(전국)
function toTransform(viewport: MapViewport | null): ZoomTransform {
  return viewport ? zoomIdentity.translate(viewport.x, viewport.y).scale(viewport.scale) : zoomIdentity;
}

function toViewport({ k, x, y }: ZoomTransform): MapViewport {
  return { scale: k, x, y };
}

function isSameTransform(a: ZoomTransform, b: ZoomTransform): boolean {
  return a.k === b.k && a.x === b.x && a.y === b.y;
}

export function MapView({ regions, visitCounts, onRegionClick, viewport, onViewportChange }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState(() => toTransform(viewport));

  // ---- 그리기: d3로 지역 모양 → path 글자 (전국이 판에 꽉 차게 맞춘다) ----
  const { projection, drawnRegions, paths } = useMemo(() => {
    const collection = {
      type: "FeatureCollection" as const,
      features: regions.map((region) => ({ type: "Feature" as const, properties: {}, geometry: region.geometry })),
    };
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], collection);
    const toPath = geoPath(projection);
    const drawnRegions = regions.map((region) => ({ ...region, d: toPath(region.geometry) ?? "" }));
    return { projection, drawnRegions, paths: drawnRegions.map((region) => region.d) };
  }, [regions]);

  // ---- 지형 무늬: 2번 이상 간 지역이 있을 때만 그림을 그린다 (F-12) ----
  const hasMany = regions.some((region) => getColorStage(visitCounts[region.code] ?? 0) === "many");
  const terrainImage = useTerrainImage({ width: WIDTH, height: HEIGHT, projection, paths }, hasMany);

  // ---- 확대·이동: 계산은 d3가 한다 ----

  // 이벤트 안에서 늘 최신 함수를 부르도록 ref에 둔다 (확대 기능을 다시 만들지 않게)
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // 받은 viewport에 맞추는 중에는 바뀌었다고 다시 알리지 않는다
  const syncingRef = useRef(false);

  // 휠·손가락(끌기, 두 손가락 확대)은 d3가 받는다. 마우스 끌기는 아래 handlePointer~가 받는다
  const zoomBehavior = useMemo(
    () =>
      zoom<SVGSVGElement, unknown>()
        .extent([
          [0, 0],
          [WIDTH, HEIGHT],
        ])
        .scaleExtent([1, MAX_SCALE])
        .filter((event: Event) => event.type === "wheel" || event.type.startsWith("touch"))
        .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          setTransform(event.transform);
          if (!syncingRef.current) onViewportChangeRef.current(toViewport(event.transform));
        }),
    [],
  );

  // 지도에 확대 기능을 붙이고, 사라질 때 뗀다
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const selection = select(svg);
    selection.call(zoomBehavior);
    return () => {
      selection.on(".zoom", null);
    };
  }, [zoomBehavior]);

  // 받은 viewport가 d3가 들고 있는 상태와 다르면 맞춘다
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const next = toTransform(viewport);
    if (isSameTransform(zoomTransform(svg), next)) return;
    syncingRef.current = true;
    select(svg).call(zoomBehavior.transform, next);
    syncingRef.current = false;
  }, [viewport, zoomBehavior]);

  // ---- 마우스 끌기: 움직인 거리만 재고 옮기는 계산은 d3에 맡긴다 ----

  // 마지막으로 본 마우스 위치 (누르고 있지 않으면 null)
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  // 이번에 누른 뒤 끌었는지. 끌었으면 손 뗄 때 생기는 클릭을 무시한다
  const draggedRef = useRef(false);

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    draggedRef.current = false;
    // 지도 밖으로 끌고 나가도 손 뗀 것을 놓치지 않게 붙잡는다 (테스트용 가짜 브라우저에는 없는 기능이라 있을 때만)
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const last = lastPointerRef.current;
    if (!svg || !last) return;
    const dx = event.clientX - last.clientX;
    const dy = event.clientY - last.clientY;
    if (!draggedRef.current && Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
    draggedRef.current = true;
    lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    // 확대 중이면 화면에서 움직인 거리를 배율로 나눠야 지도가 손을 따라온다
    const { k } = zoomTransform(svg);
    select(svg).call(zoomBehavior.translateBy, dx / k, dy / k);
  }

  function handlePointerEnd() {
    lastPointerRef.current = null;
  }

  // ---- 지역 고르기: 클릭, 키보드 Enter·Space ----

  // 누를 때 고른 지역. 마우스를 붙잡으면 클릭이 지역이 아니라 svg에서 일어나므로 미리 기억해 둔다 (UI-98)
  const pressedRegionRef = useRef<RegionCode | null>(null);

  // 지역 밖(빈 곳)을 누른 경우를 위해, 누를 때마다 먼저 비운다 (지역보다 먼저 불린다)
  function handlePointerDownCapture() {
    pressedRegionRef.current = null;
  }

  function handleRegionPointerDown(regionCode: RegionCode) {
    pressedRegionRef.current = regionCode;
  }

  // 클릭은 지역에서 나든 svg에서 나든 svg까지 올라온다. 여기서 한 번만 처리한다
  function handleMapClick() {
    const regionCode = pressedRegionRef.current;
    pressedRegionRef.current = null;
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (regionCode) onRegionClick(regionCode);
  }

  function handleRegionKeyDown(event: React.KeyboardEvent<SVGPathElement>, regionCode: RegionCode) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault(); // Space로 화면이 내려가지 않게
    onRegionClick(regionCode);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full touch-none"
      onPointerDownCapture={handlePointerDownCapture}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleMapClick}
    >
      <defs>
        {/* 전국 크기의 지형 그림 한 장을 지도 판과 같은 자리에 깐다. 각 지역에는 그 자리의 지형이 보인다 */}
        <pattern id={TERRAIN_PATTERN_ID} patternUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <rect width={WIDTH} height={HEIGHT} fill={FILL.many} />
          {terrainImage && <image href={terrainImage} width={WIDTH} height={HEIGHT} />}
        </pattern>
      </defs>
      <g transform={transform.toString()}>
        {drawnRegions.map((region) => {
          const stage = getColorStage(visitCounts[region.code] ?? 0);
          return (
            <path
              key={region.code}
              d={region.d}
              role="button"
              tabIndex={0}
              aria-label={region.name}
              data-color-stage={stage}
              fill={stage === "many" ? `url(#${TERRAIN_PATTERN_ID})` : FILL[stage]}
              stroke="#6b7280"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer outline-none focus-visible:stroke-black focus-visible:[stroke-width:2]"
              onPointerDown={() => handleRegionPointerDown(region.code)}
              onKeyDown={(event) => handleRegionKeyDown(event, region.code)}
            />
          );
        })}
      </g>
    </svg>
  );
}
