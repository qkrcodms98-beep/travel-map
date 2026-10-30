// 지형 무늬 계산 (COMPONENT_SPEC 3-2, 4장)
// 무작위 값을 쓰지 않고 경도·위도만으로 정하므로, 같은 좌표면 늘 같은 무늬가 나온다

type LonLat = [number, number];
type Rgb = [number, number, number];

// ---- 실제 산맥 자리 (경도, 위도). 선을 따라 산이 솟는다 ----
interface Range {
  points: LonLat[]; // 능선을 이은 점들. 점이 하나면 봉우리 하나
  peak: number; // 능선의 높이 (0~1)
  width: number; // 산이 퍼진 폭 (도 단위)
}

const RANGES: Range[] = [
  // 태백산맥: 설악산 → 오대산 → 태백산 → 경북 동해안
  {
    points: [
      [128.3, 38.6],
      [128.47, 38.12],
      [128.6, 37.75],
      [128.8, 37.45],
      [128.92, 37.1],
      [129.05, 36.7],
      [129.1, 36.3],
      [129.15, 35.95],
    ],
    peak: 0.95,
    width: 0.32,
  },
  // 소백산맥: 태백산 → 소백산 → 속리산 → 덕유산 → 지리산
  {
    points: [
      [128.92, 37.1],
      [128.48, 36.96],
      [128.1, 36.75],
      [127.87, 36.54],
      [127.85, 36.15],
      [127.75, 35.86],
      [127.65, 35.55],
      [127.73, 35.34],
    ],
    peak: 0.85,
    width: 0.26,
  },
  // 차령산맥
  {
    points: [
      [128.3, 37.45],
      [127.8, 37.05],
      [127.3, 36.7],
      [126.85, 36.4],
    ],
    peak: 0.5,
    width: 0.22,
  },
  // 노령산맥
  {
    points: [
      [127.6, 35.95],
      [127.15, 35.55],
      [126.8, 35.25],
    ],
    peak: 0.5,
    width: 0.2,
  },
  // 광주산맥 (경기 북동부)
  {
    points: [
      [127.6, 38.25],
      [127.45, 37.95],
      [127.3, 37.7],
    ],
    peak: 0.55,
    width: 0.2,
  },
  // 영남알프스
  {
    points: [
      [128.95, 35.7],
      [129.05, 35.5],
    ],
    peak: 0.6,
    width: 0.16,
  },
  { points: [[127.73, 35.34]], peak: 1, width: 0.18 }, // 지리산
  { points: [[128.12, 35.82]], peak: 0.55, width: 0.1 }, // 가야산
  { points: [[126.99, 35.13]], peak: 0.45, width: 0.08 }, // 무등산
  { points: [[126.53, 33.36]], peak: 1, width: 0.2 }, // 한라산
  { points: [[130.87, 37.5]], peak: 0.8, width: 0.06 }, // 울릉도 성인봉
];

// 경도 1도는 위도 1도보다 짧다 (우리나라 위도에서 약 0.82배)
const LON_SHRINK = 0.82;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// 점 p에서 선분 a-b까지의 거리 (도 단위)
function distanceToSegment([px, py]: LonLat, [ax, ay]: LonLat, [bx, by]: LonLat): number {
  const dx = (bx - ax) * LON_SHRINK;
  const dy = by - ay;
  const qx = (px - ax) * LON_SHRINK;
  const qy = py - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp((qx * dx + qy * dy) / lengthSq, 0, 1);
  return Math.hypot(qx - t * dx, qy - t * dy);
}

function distanceToRange(point: LonLat, { points }: Range): number {
  if (points.length === 1) return distanceToSegment(point, points[0], points[0]);
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i++) min = Math.min(min, distanceToSegment(point, points[i], points[i + 1]));
  return min;
}

// 산이 미치는 범위: 폭의 3배 밖은 0으로 본다
const REACH = 3;

// 산맥마다 미치는 네모 범위를 미리 구해 둔다. 범위 밖의 점은 거리를 재지 않는다 (계산을 줄이려고)
const RANGE_BOXES = RANGES.map(({ points, width }) => {
  const margin = width * REACH;
  return {
    minLon: Math.min(...points.map(([lon]) => lon)) - margin / LON_SHRINK,
    maxLon: Math.max(...points.map(([lon]) => lon)) + margin / LON_SHRINK,
    minLat: Math.min(...points.map(([, lat]) => lat)) - margin,
    maxLat: Math.max(...points.map(([, lat]) => lat)) + margin,
  };
});

// 산맥만으로 정한 높이 (0~1)
function rangeHeight(point: LonLat): number {
  const [lon, lat] = point;
  let height = 0;
  for (let i = 0; i < RANGES.length; i++) {
    const box = RANGE_BOXES[i];
    if (lon < box.minLon || lon > box.maxLon || lat < box.minLat || lat > box.maxLat) continue;
    const range = RANGES[i];
    const d = distanceToRange(point, range) / range.width;
    if (d < REACH) height = Math.max(height, range.peak * Math.exp(-d * d));
  }
  return height;
}

// ---- 노이즈: 격자 점마다 정해진 값을 두고 사이를 부드럽게 잇는다 ----

// 격자 점 (ix, iy) → 0~1. 같은 점이면 늘 같은 값
function hash(ix: number, iy: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const topLeft = hash(ix, iy);
  const bottomLeft = hash(ix, iy + 1);
  const top = topLeft + (hash(ix + 1, iy) - topLeft) * fx;
  const bottom = bottomLeft + (hash(ix + 1, iy + 1) - bottomLeft) * fx;
  return top + (bottom - top) * fy;
}

// 겹마다 격자를 이만큼 돌린다. 격자 방향(가로·세로)으로 줄무늬가 생기지 않게
const ROTATE_COS = Math.cos(0.6);
const ROTATE_SIN = Math.sin(0.6);

// 큰 굴곡 + 작은 굴곡을 겹친다. ridged면 능선처럼 뾰족하게 (0~1)
function fbm(x: number, y: number, octaves: number, ridged: boolean): number {
  let sum = 0;
  let amplitude = 0.5;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise(x, y);
    sum += amplitude * (ridged ? 1 - Math.abs(2 * n - 1) : n);
    total += amplitude;
    amplitude *= 0.5;
    // 다음 겹: 두 배 촘촘하게, 조금 돌려서
    const nextX = (x * ROTATE_COS - y * ROTATE_SIN) * 2;
    y = (x * ROTATE_SIN + y * ROTATE_COS) * 2;
    x = nextX;
  }
  return sum / total;
}

// 노이즈 굵기: 경도·위도 1도에 격자 몇 칸인지
const NOISE_SCALE = 4;
// 산맥 선을 조금씩 구불구불하게 흔드는 정도 (도)
const WARP = 0.12;

// 높이: 0(평지) ~ 1(가장 높은 산)
export function terrainHeight(lon: number, lat: number): number {
  // 산맥이 자로 그은 듯 곧지 않게, 재는 자리를 노이즈만큼 옮긴다
  const warpedLon = lon + (valueNoise(lon * 3, lat * 3) - 0.5) * 2 * WARP;
  const warpedLat = lat + (valueNoise(lon * 3 + 50, lat * 3 + 50) - 0.5) * 2 * WARP;
  const base = rangeHeight([warpedLon, warpedLat]);
  // 가지 친 골짜기와 능선
  const hills = fbm(lon * NOISE_SCALE, lat * NOISE_SCALE, 5, true);
  // 우리나라는 동쪽이 높고 서쪽이 낮다 (동고서저). 서해안 쪽은 넓은 평야
  const east = smooth(clamp((lon - 126.2) / 2.8, 0, 1));
  const hilliness = 0.12 + 0.3 * east + 0.35 * base;
  return clamp(base * 0.45 + hills * hilliness, 0, 1);
}

// ---- 색: 높이별 색 × 그림자 ----

// 높이별 색 (위성사진 느낌). [높이, 색]
const COLOR_STOPS: [number, Rgb][] = [
  [0, [164, 166, 112]], // 논밭
  [0.12, [124, 140, 80]], // 낮은 언덕, 마을 숲
  [0.28, [68, 102, 54]], // 숲
  [0.55, [44, 76, 44]], // 깊은 산
  [0.8, [38, 64, 38]], // 높은 산
  [0.95, [88, 90, 72]], // 가장 높은 능선 (바위)
];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function heightColor(height: number): Rgb {
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [h0, c0] = COLOR_STOPS[i];
    const [h1, c1] = COLOR_STOPS[i + 1];
    if (height <= h1) return mix(c0, c1, (height - h0) / (h1 - h0));
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1];
}

// 그림자 계산에 쓰는 거리 (도)
const SHADE_STEP = 0.01;
// 낮은 곳 논밭 조각 무늬의 굵기
const FIELD_SCALE = 60;

export function terrainColor(lon: number, lat: number): Rgb {
  const height = terrainHeight(lon, lat);
  // 북서쪽에서 빛이 온다: 북서쪽이 높고 남동쪽이 낮으면 빛을 등진 비탈이라 어둡다
  const northWest = terrainHeight(lon - SHADE_STEP, lat + SHADE_STEP);
  const southEast = terrainHeight(lon + SHADE_STEP, lat - SHADE_STEP);
  const shade = clamp(1 - (northWest - southEast) * 8, 0.6, 1.35);
  // 평지에는 논밭 조각처럼 밝기가 조금씩 다른 무늬를 넣는다
  const fields = 1 + (valueNoise(lon * FIELD_SCALE, lat * FIELD_SCALE) - 0.5) * 0.25 * (1 - clamp(height * 4, 0, 1));
  const [r, g, b] = heightColor(height);
  const light = shade * fields;
  return [
    Math.round(clamp(r * light, 0, 255)),
    Math.round(clamp(g * light, 0, 255)),
    Math.round(clamp(b * light, 0, 255)),
  ];
}

// width×height 그림의 RGBA 값. toLonLat가 null이면 투명하게 둔다
export function paintTerrain(
  width: number,
  height: number,
  toLonLat: (x: number, y: number) => LonLat | null,
): Uint8ClampedArray<ArrayBuffer> {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lonLat = toLonLat(x, y);
      if (!lonLat) continue;
      const [r, g, b] = terrainColor(lonLat[0], lonLat[1]);
      const i = (y * width + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}
