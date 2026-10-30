import { splitDiaryChars } from "@/lib/countDiaryChars";

// countDiaryChars와 같은 기준으로 max자까지만 남긴다. 이모지가 반으로 쪼개지지 않는다 (COMPONENT_SPEC 4장)
export function cutToMaxChars(text: string, max: number): string {
  return splitDiaryChars(text).slice(0, max).join("");
}
