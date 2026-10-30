import { render, screen } from "@testing-library/react";
import { TripListItem } from "@/components/TripListItem";
import type { Trip, TripWithNumber } from "@/types/trip";
import { T2, T3 } from "../../tests/fixtures/trips";

const withNumber = (trip: Trip, tripNumber: number): TripWithNumber => ({ ...trip, tripNumber });

// 여행 하나는 상세로 가는 링크 하나다. 링크 이름은 번호 + 날짜
const tripLink = () => screen.getByRole("link");

describe("TripListItem", () => {
  it("UI-23 T2(당일치기)는 '두 번째 여행' 아래에 '2026.06.01 (당일치기)'를 보여 준다", () => {
    render(<TripListItem trip={withNumber(T2, 2)} href="/regions/99010/trips/t2" />);

    const number = screen.getByText("두 번째 여행");
    const dates = screen.getByText("2026.06.01 (당일치기)");
    // 번호가 먼저(위), 날짜가 나중(아래)
    expect(number.compareDocumentPosition(dates) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tripLink()).toContainElement(number);
    expect(tripLink()).toContainElement(dates);
  });

  it("UI-24 T3는 날짜를 '2026.07.01 ~ 07.03'으로 보여 준다", () => {
    render(<TripListItem trip={withNumber(T3, 3)} href="/regions/99010/trips/t3" />);
    expect(screen.getByText("2026.07.01 ~ 07.03")).toBeInTheDocument();
  });

  it("UI-25 여행 하나를 누르면 그 여행의 상세 주소로 이동한다", () => {
    render(<TripListItem trip={withNumber(T2, 2)} href="/regions/99010/trips/t2" />);
    // 가짜 브라우저는 실제로 주소를 옮기지 않아서, 링크가 가리키는 주소를 확인한다
    expect(tripLink()).toHaveAttribute("href", "/regions/99010/trips/t2");
  });
});
