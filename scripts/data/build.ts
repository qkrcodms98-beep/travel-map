import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import area from "@turf/area";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import mapshaper from "mapshaper";
import { toMergedRegionCode } from "@/lib/toMergedRegionCode";
import {
  DATA_VERSION,
  EXPECTED_DONG_COUNT,
  MAX_REGIONS_MAP_BYTES,
  OUT_DIR,
  RAW_FILE,
  SIMPLIFY_PERCENT,
} from "./config";

// 원본 행정동 한 개의 속성 (admdongkor)
interface RawDongProps {
  adm_nm: string; // "대구광역시 군위군 군위읍"
  adm_cd2: string; // 행정동 코드 10자리
  sgg: string; // 시·군·구 코드 5자리 (합치기 전)
  sidonm: string; // 시·도 이름
  sggnm: string; // 시·군·구 이름 (합치기 전, 예: "수원시장안구")
}

// 변환할 때 쓰는 동네 속성
interface DongProps {
  code: string;
  name: string;
  regionCode: string;
  regionName: string;
}

type DongGeometry = Polygon | MultiPolygon;

interface RegionEntry {
  code: string;
  name: string;
}

interface DongEntry {
  code: string;
  name: string;
  regionCode: string;
}

// "수원시장안구"처럼 구가 붙은 이름에서 "수원시"만 남긴다
function toCityName(sggName: string): string {
  const match = /^(.+?시)/.exec(sggName);
  if (!match) {
    throw new Error(`시 이름을 찾을 수 없음: ${sggName}`);
  }
  return match[1];
}

function toRegionName(props: RawDongProps, regionCode: string): string {
  const isMerged = regionCode !== props.sgg;
  const sggName = isMerged ? toCityName(props.sggnm) : props.sggnm;
  return `${props.sidonm} ${sggName}`;
}

function readRawData(): FeatureCollection<DongGeometry, RawDongProps> {
  if (!existsSync(RAW_FILE)) {
    throw new Error(`원본이 없음: ${RAW_FILE}\n먼저 npm run data:download를 실행하세요`);
  }
  const parsed: unknown = JSON.parse(readFileSync(RAW_FILE, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !("features" in parsed)) {
    throw new Error("원본 형식이 GeoJSON FeatureCollection이 아님");
  }
  return parsed as FeatureCollection<DongGeometry, RawDongProps>;
}

// mapshaper로 모양을 줄이고 TopoJSON 글자로 돌려준다
async function toTopoJson(input: string, commands: string, outName: string): Promise<string> {
  const output = await mapshaper.applyCommands(`-i dongs.json ${commands} -o ${outName} format=topojson`, {
    "dongs.json": input,
  });
  const content = output[outName];
  if (content === undefined) {
    throw new Error(`mapshaper 결과가 없음: ${outName}`);
  }
  return content.toString();
}

function sortByCode<T extends { code: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.code.localeCompare(b.code));
}

async function main(): Promise<void> {
  const raw = readRawData();

  // 1. 동네마다 소속 시·군·구(합친 뒤)를 붙이고, 원본 모양으로 넓이를 잰다
  const regions = new Map<string, string>(); // 코드 → 이름
  const regionAreas: Record<string, number> = {};
  const dongFeatures: Feature<DongGeometry, DongProps>[] = [];

  for (const feature of raw.features) {
    const props = feature.properties;
    const regionCode = toMergedRegionCode(props.sgg);
    const regionName = toRegionName(props, regionCode);
    const dongName = props.adm_nm.split(" ")[2];

    regions.set(regionCode, regionName);
    regionAreas[regionCode] = (regionAreas[regionCode] ?? 0) + area(feature);
    dongFeatures.push({
      type: "Feature",
      geometry: feature.geometry,
      properties: { code: props.adm_cd2, name: dongName, regionCode, regionName },
    });
  }

  // 2. 지도 파일 2개 (시·군·구는 같은 코드끼리 합친 뒤 줄인다)
  const prepared = JSON.stringify({ type: "FeatureCollection", features: dongFeatures });
  const regionsTopo = await toTopoJson(
    prepared,
    `-dissolve regionCode copy-fields=regionName -rename-fields code=regionCode,name=regionName -simplify ${SIMPLIFY_PERCENT} keep-shapes -rename-layers regions`,
    "regions.topo.json",
  );
  const dongsTopo = await toTopoJson(
    prepared,
    `-filter-fields code,name,regionCode -simplify ${SIMPLIFY_PERCENT} keep-shapes -rename-layers dongs`,
    "dongs.topo.json",
  );

  // 3. 코드와 이름 목록, 넓이
  const regionList: RegionEntry[] = sortByCode([...regions].map(([code, name]) => ({ code, name })));
  const dongList: DongEntry[] = sortByCode(
    dongFeatures.map(({ properties: { code, name, regionCode } }) => ({ code, name, regionCode })),
  );
  const codesJson = JSON.stringify({ version: DATA_VERSION, regions: regionList, dongs: dongList });
  const roundedAreas = Object.fromEntries(
    regionList.map(({ code }) => [code, Math.round(regionAreas[code])]),
  );
  const areasJson = JSON.stringify({ version: DATA_VERSION, unit: "m2", areas: roundedAreas });

  // 4. 스스로 검사한다. 하나라도 틀리면 파일을 쓰지 않고 멈춘다
  const regionCodes = new Set(regionList.map((r) => r.code));
  const regionGeometryCount = (
    JSON.parse(regionsTopo) as { objects: { regions: { geometries: unknown[] } } }
  ).objects.regions.geometries.length;
  const checks: [string, boolean][] = [
    [`읍·면·동 개수가 ${EXPECTED_DONG_COUNT}개 (실제 ${dongList.length}개)`, dongList.length === EXPECTED_DONG_COUNT],
    ["동네 코드가 겹치지 않음", new Set(dongList.map((d) => d.code)).size === dongList.length],
    ["시·군·구 코드가 겹치지 않음", regionCodes.size === regionList.length],
    ["군위군(27720)이 대구광역시 소속", regions.get("27720") === "대구광역시 군위군"],
    ["구가 있는 시가 시 하나로 합쳐짐 (예: 수원시 41110 있음, 장안구 41111 없음)",
      regionCodes.has("41110") && !regionCodes.has("41111") &&
      regionList.every((r) => toMergedRegionCode(r.code) === r.code)],
    ["모든 동네의 소속 시·군·구가 목록에 있음", dongList.every((d) => regionCodes.has(d.regionCode))],
    ["모든 시·군·구의 넓이가 0보다 큼", regionList.every((r) => roundedAreas[r.code] > 0)],
    [`시·군·구 지도의 지역 수가 목록과 같음 (${regionGeometryCount}개)`, regionGeometryCount === regionList.length],
    [`시·군·구 지도 파일이 1MB 이하 (${(Buffer.byteLength(regionsTopo) / 1024).toFixed(0)}KB)`,
      Buffer.byteLength(regionsTopo) <= MAX_REGIONS_MAP_BYTES],
  ];

  console.log("[검사]");
  for (const [label, passed] of checks) {
    console.log(`  ${passed ? "✓" : "✕"} ${label}`);
  }
  if (checks.some(([, passed]) => !passed)) {
    throw new Error("검사 실패. 파일을 쓰지 않았습니다");
  }

  // 5. 파일 쓰기
  const outputs: [string, string][] = [
    ["regions.topo.json", regionsTopo],
    ["dongs.topo.json", dongsTopo],
    ["codes.json", codesJson],
    ["areas.json", areasJson],
  ];
  console.log(`[만든 파일] 시·군·구 ${regionList.length}개, 읍·면·동 ${dongList.length}개`);
  for (const [name, content] of outputs) {
    writeFileSync(path.join(OUT_DIR, name), content);
    console.log(`  ${name}: ${(Buffer.byteLength(content) / 1024).toFixed(0)}KB`);
  }
  rmSync(path.join(OUT_DIR, ".gitkeep"), { force: true });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
