import type { Polygon } from "geojson";
import type { Topology } from "topojson-specification";

// 테스트용 가짜 지도 (TEST_CASES 2장). 사각형 2개
// A = 99010 테스트시 가구 (0,0)~(1,1), B = 99020 테스트시 나구 (1,0)~(4,1)
// d3는 시계 방향으로 감은 모양을 안쪽으로 본다. 진짜 지도 파일도 시계 방향이다

const SQUARE_A: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  ],
};

const SQUARE_B: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [1, 0],
      [1, 1],
      [4, 1],
      [4, 0],
      [1, 0],
    ],
  ],
};

// MapView에 바로 넣는 모양 (COMPONENT_SPEC 3-2의 RegionFeature)
export const FAKE_REGION_FEATURES = [
  { code: "99010", name: "테스트시 가구", geometry: SQUARE_A },
  { code: "99020", name: "테스트시 나구", geometry: SQUARE_B },
];

// public/data/regions.topo.json과 같은 모양 (첫 화면이 불러오는 파일)
export const FAKE_REGIONS_TOPOLOGY: Topology = {
  type: "Topology",
  arcs: [SQUARE_A.coordinates[0], SQUARE_B.coordinates[0]],
  objects: {
    regions: {
      type: "GeometryCollection",
      geometries: [
        { type: "Polygon", arcs: [[0]], properties: { code: "99010", name: "테스트시 가구" } },
        { type: "Polygon", arcs: [[1]], properties: { code: "99020", name: "테스트시 나구" } },
      ],
    },
  },
};
