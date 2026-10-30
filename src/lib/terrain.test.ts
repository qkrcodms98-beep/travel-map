import { paintTerrain, terrainColor, terrainHeight } from "@/lib/terrain";

// 지형 무늬 계산 (TEST_CASES 3-4-1)
const JIRISAN: [number, number] = [127.73, 35.34];
const SEORAKSAN: [number, number] = [128.47, 38.12];
const HALLASAN: [number, number] = [126.53, 33.36];
const GIMJE_PLAIN: [number, number] = [126.88, 35.8];

describe("terrain", () => {
  it("LOGIC-100 같은 좌표면 늘 같은 높이와 색이다", () => {
    expect(terrainHeight(...JIRISAN)).toBe(terrainHeight(...JIRISAN));
    expect(terrainColor(...JIRISAN)).toEqual(terrainColor(...JIRISAN));
  });

  it("LOGIC-101 높이는 0 이상 1 이하다", () => {
    for (let lon = 124.5; lon <= 131; lon += 0.37) {
      for (let lat = 33; lat <= 38.7; lat += 0.29) {
        const height = terrainHeight(lon, lat);
        expect(height).toBeGreaterThanOrEqual(0);
        expect(height).toBeLessThanOrEqual(1);
      }
    }
  });

  it("LOGIC-102 지리산·설악산·한라산은 김제 평야보다 높다", () => {
    const plain = terrainHeight(...GIMJE_PLAIN);
    expect(terrainHeight(...JIRISAN)).toBeGreaterThan(plain);
    expect(terrainHeight(...SEORAKSAN)).toBeGreaterThan(plain);
    expect(terrainHeight(...HALLASAN)).toBeGreaterThan(plain);
  });

  it("LOGIC-103 paintTerrain은 점마다 terrainColor로 칠하고, null인 점은 투명하다", () => {
    // 2×2 그림. 왼쪽 위(0,0)만 지도 밖
    const toLonLat = (x: number, y: number): [number, number] | null =>
      x === 0 && y === 0 ? null : [127 + x, 36 + y];
    const pixels = paintTerrain(2, 2, toLonLat);

    expect(pixels).toHaveLength(16);
    expect(pixels[3]).toBe(0);
    // 오른쪽 아래(1,1)는 다섯 번째 값부터 네 칸씩: (1,1) → 인덱스 (1*2+1)*4 = 12
    expect(Array.from(pixels.slice(12, 16))).toEqual([...terrainColor(128, 37), 255]);
    expect(pixels[7]).toBe(255);
    expect(pixels[11]).toBe(255);
    expect(paintTerrain(2, 2, toLonLat)).toEqual(pixels);
  });
});
