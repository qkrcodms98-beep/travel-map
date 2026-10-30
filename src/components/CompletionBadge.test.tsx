import { render, screen } from "@testing-library/react";
import { CompletionBadge } from "@/components/CompletionBadge";
import { calcCompletion } from "@/lib/calcCompletion";
import { countVisits } from "@/lib/countVisits";
import { FAKE_REGION_AREAS } from "../../tests/fixtures/areas";
import { T1 } from "../../tests/fixtures/trips";

// 첫 화면과 같은 순서로 완성도를 만든다: 여행 → 방문 횟수 → 완성도
const percentOf = (trips: (typeof T1)[]) => calcCompletion(Object.keys(countVisits(trips)), FAKE_REGION_AREAS);

describe("CompletionBadge", () => {
  it('UI-18 A에 여행 1개면 "지도 완성도 25.0%"', () => {
    render(<CompletionBadge percent={percentOf([T1])} />);
    expect(screen.getByText("지도 완성도 25.0%")).toBeInTheDocument();
  });

  it('UI-19 여행이 없으면 "지도 완성도 0%"', () => {
    render(<CompletionBadge percent={percentOf([])} />);
    expect(screen.getByText("지도 완성도 0%")).toBeInTheDocument();
  });
});
