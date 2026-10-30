import { assignTripNumbers } from "@/lib/assignTripNumbers";
import type { TripWithNumber } from "@/types/trip";
import { S1, S2, T1, T2, T3 } from "../../tests/fixtures/trips";

// 결과를 { 여행 id: 번호 } 모양으로 바꿔 비교하기 쉽게 한다
function numbersById(trips: TripWithNumber[]): Record<string, number> {
  return Object.fromEntries(trips.map((trip) => [trip.id, trip.tripNumber]));
}

// 여행 번호 매기기 (TEST_CASES 3-2)
describe("assignTripNumbers", () => {
  it("LOGIC-10 여행이 없으면 빈 목록을 돌려준다", () => {
    expect(assignTripNumbers([])).toEqual([]);
  });

  it("LOGIC-11 뒤섞어 넣어도 시작일 순으로 번호를 매긴다", () => {
    const result = assignTripNumbers([T3, T1, T2]);
    expect(numbersById(result)).toEqual({ t1: 1, t2: 2, t3: 3 });
  });

  it("LOGIC-12 시작일이 같으면 먼저 기록한 여행이 앞 번호다", () => {
    const result = assignTripNumbers([S2, S1]);
    expect(numbersById(result)).toEqual({ s1: 1, s2: 2 });
  });

  it("LOGIC-13 기록한 시각보다 시작일이 먼저다", () => {
    const earlyRecordedT3 = { ...T3, createdAt: "2026-01-01T00:00:00Z" };
    const result = assignTripNumbers([T1, T2, earlyRecordedT3]);
    expect(numbersById(result)).toEqual({ t1: 1, t2: 2, t3: 3 });
  });

  it("LOGIC-14 시작일을 고치면 번호를 다시 매긴다", () => {
    const movedT3 = { ...T3, startDate: "2026-04-01" };
    const result = assignTripNumbers([T1, T2, movedT3]);
    expect(numbersById(result)).toEqual({ t3: 1, t1: 2, t2: 3 });
  });

  it("LOGIC-15 여행을 지우면 빈 번호 없이 다시 매긴다", () => {
    const result = assignTripNumbers([T1, T3]);
    expect(numbersById(result)).toEqual({ t1: 1, t3: 2 });
  });

  it("LOGIC-16 일기만 고치면 번호가 그대로다", () => {
    const editedT2 = { ...T2, diary: "일기를 고쳤다", updatedAt: "2026-10-01T00:00:00Z" };
    const result = assignTripNumbers([T1, editedT2, T3]);
    expect(numbersById(result)).toEqual({ t1: 1, t2: 2, t3: 3 });
  });

  it("LOGIC-17 종료일은 번호에 영향이 없다", () => {
    const longT1 = { ...T1, endDate: "2026-12-31" };
    const result = assignTripNumbers([longT1, T2, T3]);
    expect(numbersById(result)).toEqual({ t1: 1, t2: 2, t3: 3 });
  });

  it("LOGIC-18 넣은 배열 자체는 바뀌지 않는다", () => {
    const input = [T3, T1, T2];
    const before = input.map((trip) => ({ ...trip }));
    assignTripNumbers(input);
    expect(input).toEqual(before);
  });
});
