import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { RAW_DIR, RAW_FILE, SOURCE_URL } from "./config";

// admdongkor 원본 GeoJSON을 data-raw/에 받는다. 이미 있으면 건너뛴다 (--force로 다시 받기)
async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  if (existsSync(RAW_FILE) && !force) {
    console.log(`이미 있어서 건너뜀: ${RAW_FILE}`);
    return;
  }

  console.log(`받는 중: ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`받기 실패: HTTP ${response.status}`);
  }

  const content = Buffer.from(await response.arrayBuffer());
  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(RAW_FILE, content);
  console.log(`저장함: ${RAW_FILE} (${(content.length / 1024 / 1024).toFixed(1)}MB)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
