import path from "node:path";
import sharp from "sharp";

// 아이콘 원본(SVG) 하나로 크기별 PNG를 만든다 (COMPONENT_SPEC 11-3)
// 아이콘을 바꾸려면 public/icons/icon.svg를 바꾸고 npm run icons:build를 다시 실행한다
const ICON_DIR = path.join(process.cwd(), "public", "icons");
const SOURCE = path.join(ICON_DIR, "icon.svg");

const OUTPUTS = [
  { file: "icon-192.png", size: 192 }, // 안드로이드
  { file: "icon-512.png", size: 512 }, // 안드로이드 (큰 아이콘, 모양 맞춤)
  { file: "apple-touch-icon.png", size: 180 }, // 아이폰
];

async function main(): Promise<void> {
  for (const { file, size } of OUTPUTS) {
    // SVG를 크게 읽은 뒤 줄여야 가장자리가 매끄럽다
    await sharp(SOURCE, { density: 300 }).resize(size, size).png().toFile(path.join(ICON_DIR, file));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
