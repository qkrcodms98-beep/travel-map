"use client";

import { useEffect, useState } from "react";
import type { GeoProjection } from "d3";
import { paintTerrain } from "@/lib/terrain";

// 지형 무늬 그림을 캔버스에 한 장 그려 PNG 글자(data URL)로 돌려준다 (COMPONENT_SPEC 3-2)
// 다 그리기 전이나 캔버스를 쓸 수 없으면 null

// 지도 판보다 몇 배 촘촘하게 그릴지
const RESOLUTION = 2;
// 한 번에 그리는 줄 수. 나눠 그려서 그리는 동안 화면이 멈추지 않게 한다
const ROWS_PER_FRAME = 20;

// 한 번 그린 그림은 기억해 둔다 (첫 화면으로 돌아올 때 다시 그리지 않게). 지도 맞춤(투영)이 같으면 같은 그림이다
const cache = new Map<string, string>();

interface TerrainSource {
  width: number; // 지도 판 크기
  height: number;
  projection: GeoProjection; // 지도 판 좌표 ↔ 경도·위도
  paths: string[]; // 땅 모양 (지역 path 글자). 땅인 곳만 칠한다
}

export function useTerrainImage({ width, height, projection, paths }: TerrainSource, enabled: boolean): string | null {
  const key = `${projection.scale()},${projection.translate().join(",")}`;
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const cached = cache.get(key);
    if (cached) {
      setImage({ key, url: cached });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width * RESOLUTION;
    canvas.height = height * RESOLUTION;
    const context = canvas.getContext("2d");
    if (!context) return;

    // 1) 땅 모양을 먼저 칠해 "땅인 곳" 표시로 쓴다
    context.setTransform(RESOLUTION, 0, 0, RESOLUTION, 0, 0);
    for (const d of paths) context.fill(new Path2D(d));
    context.setTransform(1, 0, 0, 1, 0, 0);
    const land = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 2) 땅인 곳만 지형 색으로 칠한다. 몇 줄씩 나눠 그린다
    let row = 0;
    let frame = 0;
    const drawRows = () => {
      const rows = Math.min(ROWS_PER_FRAME, canvas.height - row);
      const top = row;
      const pixels = paintTerrain(canvas.width, rows, (x, y) => {
        if (land[((y + top) * canvas.width + x) * 4 + 3] === 0) return null;
        return projection.invert?.([(x + 0.5) / RESOLUTION, (y + top + 0.5) / RESOLUTION]) ?? null;
      });
      context.putImageData(new ImageData(pixels, canvas.width, rows), 0, top);
      row += rows;
      if (row < canvas.height) {
        frame = requestAnimationFrame(drawRows);
        return;
      }
      const url = canvas.toDataURL("image/png");
      cache.set(key, url);
      setImage({ key, url });
    };
    frame = requestAnimationFrame(drawRows);
    return () => cancelAnimationFrame(frame);
  }, [enabled, key, width, height, projection, paths]);

  return image?.key === key ? image.url : null;
}
