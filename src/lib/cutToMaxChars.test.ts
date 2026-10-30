import { cutToMaxChars } from "@/lib/cutToMaxChars";

// 글자 자르기. countDiaryChars 기준으로 센다 (TEST_CASES 3-9)
describe("cutToMaxChars", () => {
  it('LOGIC-94 "가" 2,100자를 2,000자까지 자른다', () => {
    expect(cutToMaxChars("가".repeat(2100), 2000)).toBe("가".repeat(2000));
  });

  it("LOGIC-95 이모지를 반으로 쪼개지 않는다", () => {
    expect(cutToMaxChars("가".repeat(1999) + "😀😀", 2000)).toBe("가".repeat(1999) + "😀");
  });
});
