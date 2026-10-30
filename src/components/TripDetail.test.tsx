import { render, screen } from "@testing-library/react";
import { TripDetail } from "@/components/TripDetail";
import { T2 } from "../../tests/fixtures/trips";

describe("TripDetail", () => {
  it("UI-71 일기가 ''이면 '여행일기' 아래에 '작성한 여행일기가 없어요.'가 보인다", () => {
    render(<TripDetail trip={{ ...T2, diary: "", tripNumber: 2 }} dongNames={[]} />);

    expect(screen.getByRole("heading", { name: "여행일기" })).toBeInTheDocument();
    expect(screen.getByText("작성한 여행일기가 없어요.")).toBeInTheDocument();
  });

  it("UI-72 동네를 안 고른 여행은 '다녀온 동네' 아래 '고른 동네가 없어요.'가 보인다", () => {
    render(<TripDetail trip={{ ...T2, tripNumber: 2 }} dongNames={[]} />);

    expect(screen.getByRole("heading", { name: "다녀온 동네" })).toBeInTheDocument();
    expect(screen.getByText("고른 동네가 없어요.")).toBeInTheDocument();
  });

  it("UI-73 '가동', '나동'을 고른 여행은 두 동네가 보인다", () => {
    render(
      <TripDetail trip={{ ...T2, dongCodes: ["9901010100", "9901010200"], tripNumber: 2 }} dongNames={["가동", "나동"]} />,
    );

    expect(screen.getByText("가동")).toBeInTheDocument();
    expect(screen.getByText("나동")).toBeInTheDocument();
    expect(screen.queryByText("고른 동네가 없어요.")).not.toBeInTheDocument();
  });
});
