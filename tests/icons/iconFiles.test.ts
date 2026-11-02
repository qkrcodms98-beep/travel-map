import { readFileSync } from "node:fs";
import path from "node:path";

// 아이콘 파일 확인 (TEST_CASES 3-5). npm run icons:build가 만든 진짜 파일을 읽는다
const ICON_DIR = path.join(process.cwd(), "public", "icons");

// PNG 머리글에서 가로·세로 크기를 읽는다 (16~23번째 바이트)
function pngSize(fileName: string): { width: number; height: number } {
  const bytes = readFileSync(path.join(ICON_DIR, fileName));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("아이콘 파일", () => {
  it.each([
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["apple-touch-icon.png", 180],
  ])("LOGIC-120 %s는 %i×%i다", (fileName, size) => {
    expect(pngSize(fileName)).toEqual({ width: size, height: size });
  });
});
