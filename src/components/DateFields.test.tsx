import { render, screen } from "@testing-library/react";
import { DateFields } from "@/components/DateFields";

describe("DateFields", () => {
  it("UI-41 오늘이 2026-10-29이면 시작일 칸의 가장 늦은 날짜는 2026-10-29이고, 종료일 칸에는 제한이 없다", () => {
    render(<DateFields startDate="" endDate="" today="2026-10-29" onChange={jest.fn()} />);

    expect(screen.getByLabelText("시작일 (필수)")).toHaveAttribute("max", "2026-10-29");
    expect(screen.getByLabelText("종료일")).not.toHaveAttribute("max");
  });
});
