// 여행일기를 문자 하나씩 나눈다. 펼치기([...])는 😀를 1개로 나누지만 length는 2로 센다
export function splitDiaryChars(text: string): string[] {
  return [...text];
}

// 여행일기 글자 수. 문자 하나를 1자로 센다 (이모지 😀도 1자). 화면과 서버가 같이 쓴다 (COMPONENT_SPEC 4장)
export function countDiaryChars(text: string): number {
  return splitDiaryChars(text).length;
}
