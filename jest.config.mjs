import nextJest from "next/jest.js";

// Next.js 설정(TypeScript, JSX 변환)을 Jest에 그대로 쓴다
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  // 테스트 안에서 가짜 브라우저 화면을 쓴다
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // "@/lib/..." → "src/lib/..." (tsconfig의 paths와 같게)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

// d3는 import 문법(ESM)으로만 배포되어 Jest가 그대로 못 읽는다. d3와 d3가 쓰는 패키지만 변환하게 예외를 둔다
// (next/jest가 정한 값을 덮어써야 해서, 만든 설정을 받은 뒤 바꾼다)
const ESM_PACKAGES = ["d3", "d3-[^/\\\\]+", "internmap", "delaunator", "robust-predicates"].join("|");

export default async function jestConfig() {
  const nextConfig = await createJestConfig(config)();
  return {
    ...nextConfig,
    transformIgnorePatterns: [
      `[/\\\\]node_modules[/\\\\](?!(${ESM_PACKAGES})[/\\\\])`,
      ...(nextConfig.transformIgnorePatterns ?? []).filter((pattern) => !pattern.includes("node_modules")),
    ],
  };
}
