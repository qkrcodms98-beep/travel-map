import { getColorStage } from "@/lib/getColorStage";

// 방문 횟수로 색칠 단계 정하기 (TEST_CASES 3-1)
describe("getColorStage", () => {
  it('LOGIC-03 0번이면 "none" (흰색)', () => {
    expect(getColorStage(0)).toBe("none");
  });

  it('LOGIC-04 1번이면 "once" (연두색)', () => {
    expect(getColorStage(1)).toBe("once");
  });

  // 2번 이상은 모두 같은 단계 (v0.4 전에는 진한 초록, v0.4부터 지형 무늬)
  it('LOGIC-05 2번이면 "many"', () => {
    expect(getColorStage(2)).toBe("many");
  });

  it('LOGIC-06 5번이면 "many"', () => {
    expect(getColorStage(5)).toBe("many");
  });
});
