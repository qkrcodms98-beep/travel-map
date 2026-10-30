// 지도 완성도 글자 (COMPONENT_SPEC 3-3)
// 0 → "0%", 0.04 → "0.1% 미만", 12.39 → "12.3%"(버림), 99.96 → "99.9%", 100 → "100%"
export function formatPercent(percent: number): string {
  if (percent === 0) return "0%";
  if (percent === 100) return "100%";
  if (percent < 0.1) return "0.1% 미만";
  // 소수 첫째 자리까지 버림. 0.000001을 더하는 것은 4.1 × 10이 40.99999…로 계산되는 소수 오차를 막기 위해서다
  const floored = Math.floor(percent * 10 + 1e-6) / 10;
  return `${floored.toFixed(1)}%`;
}
