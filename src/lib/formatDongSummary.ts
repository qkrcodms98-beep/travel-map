// 목록 카드에 보여 줄 동네 수
const MAX_SHOWN = 3;

// 동네 요약 글자: "가동, 나동, 다동 외 2곳". 동네가 없으면 null (COMPONENT_SPEC 4장)
export function formatDongSummary(dongNames: string[]): string | null {
  if (dongNames.length === 0) return null;
  const shown = dongNames.slice(0, MAX_SHOWN).join(", ");
  const rest = dongNames.length - MAX_SHOWN;
  return rest > 0 ? `${shown} 외 ${rest}곳` : shown;
}
