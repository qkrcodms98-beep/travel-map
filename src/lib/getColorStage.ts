// 색칠 단계: "none" 흰색, "once" 연두색, "many" 진한 초록 (v0.4부터 지형 무늬)
export type ColorStage = "none" | "once" | "many";

// 방문 횟수로 색칠 단계를 정한다 (COMPONENT_SPEC 4장)
export function getColorStage(visitCount: number): ColorStage {
  if (visitCount === 0) return "none";
  if (visitCount === 1) return "once";
  return "many";
}
