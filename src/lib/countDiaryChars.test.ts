import { countDiaryChars } from "@/lib/countDiaryChars";

// 여행일기 글자 세기. 문자 하나를 1자로 센다 (TEST_CASES 3-9)
describe("countDiaryChars", () => {
  it("LOGIC-90 빈 글이면 0자다", () => {
    expect(countDiaryChars("")).toBe(0);
  });

  it('LOGIC-91 "가😀a"는 3자다', () => {
    expect(countDiaryChars("가😀a")).toBe(3);
  });

  // JavaScript length로는 4,000이다
  it("LOGIC-92 😀 2,000개는 2,000자다", () => {
    expect(countDiaryChars("😀".repeat(2000))).toBe(2000);
  });

  // 👨 + 이음 문자 + 👩 + 이음 문자 + 👧. 눈에는 1개지만 DB처럼 5자로 센다
  it("LOGIC-93 가족 이모지는 5자다", () => {
    expect(countDiaryChars("👨‍👩‍👧")).toBe(5);
  });
});
