// 1~10번째는 한글로 쓴다
const KOREAN_ORDINALS: readonly string[] = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

// 여행 번호 글자. 1 → "첫 번째 여행", 11 → "11번째 여행" (COMPONENT_SPEC 4장)
export function formatTripNumber(tripNumber: number): string {
  if (tripNumber <= KOREAN_ORDINALS.length) {
    return `${KOREAN_ORDINALS[tripNumber - 1]} 번째 여행`;
  }
  return `${tripNumber}번째 여행`;
}
