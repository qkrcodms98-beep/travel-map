import { assignTripNumbers } from "@/lib/assignTripNumbers";
import { sortTripsNewestFirst } from "@/lib/sortTripsNewestFirst";
import type { Trip, TripWithNumber } from "@/types/trip";
import { S1, S2, T1, T2, T3 } from "../../tests/fixtures/trips";

// 정렬 테스트에 넣을 번호 붙은 여행을 만든다
function withNumber(trip: Trip, tripNumber: number): TripWithNumber {
  return { ...trip, tripNumber };
}

// 목록 정렬 (TEST_CASES 3-3)
describe("sortTripsNewestFirst", () => {
  it("LOGIC-20 시작일이 늦은 여행이 위에 온다", () => {
    const result = sortTripsNewestFirst([withNumber(T1, 1), withNumber(T2, 2), withNumber(T3, 3)]);
    expect(result.map((trip) => trip.id)).toEqual(["t3", "t2", "t1"]);
  });

  it("LOGIC-21 시작일이 같으면 나중에 기록한 여행이 위에 온다", () => {
    const result = sortTripsNewestFirst([withNumber(S1, 1), withNumber(S2, 2)]);
    expect(result.map((trip) => trip.id)).toEqual(["s2", "s1"]);
  });

  it("LOGIC-22 번호를 매긴 뒤 정렬하면 맨 위가 가장 큰 번호다", () => {
    const result = sortTripsNewestFirst(assignTripNumbers([T1, T2, T3, S1, S2]));
    expect(result.map((trip) => [trip.id, trip.tripNumber])).toEqual([
      ["s2", 5],
      ["s1", 4],
      ["t3", 3],
      ["t2", 2],
      ["t1", 1],
    ]);
  });

  it("LOGIC-23 넣은 배열 자체는 바뀌지 않는다", () => {
    const input = [withNumber(T1, 1), withNumber(T2, 2), withNumber(T3, 3)];
    const before = input.map((trip) => ({ ...trip }));
    sortTripsNewestFirst(input);
    expect(input).toEqual(before);
  });
});
