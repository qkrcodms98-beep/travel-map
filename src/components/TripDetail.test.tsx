import { render, screen } from "@testing-library/react";
import { TripDetail } from "@/components/TripDetail";
import { T2 } from "../../tests/fixtures/trips";

describe("TripDetail", () => {
  it("UI-71 일기가 ''이면 '여행일기' 아래에 '작성한 여행일기가 없어요.'가 보인다", () => {
    render(<TripDetail trip={{ ...T2, diary: "", tripNumber: 2 }} dongNames={[]} />);

    expect(screen.getByRole("heading", { name: "여행일기" })).toBeInTheDocument();
    expect(screen.getByText("작성한 여행일기가 없어요.")).toBeInTheDocument();
  });
});
