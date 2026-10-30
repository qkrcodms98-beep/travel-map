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

export default createJestConfig(config);
