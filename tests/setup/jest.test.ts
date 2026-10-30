// Jest가 TypeScript 테스트를 돌릴 수 있는지 확인한다
describe("Jest 설정", () => {
  it("TypeScript로 쓴 테스트를 실행한다", () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(1, 2)).toBe(3);
  });
});
