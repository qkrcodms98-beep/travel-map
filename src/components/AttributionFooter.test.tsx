import { render, screen } from "@testing-library/react";
import { AttributionFooter } from "@/components/AttributionFooter";

describe("AttributionFooter", () => {
  it("UI-90 지도 데이터 출처 문구를 보여 준다", () => {
    render(<AttributionFooter />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)");
  });

  it("UI-91 admdongkor 링크는 데이터 페이지로 가고 새 탭에서 열린다", () => {
    render(<AttributionFooter />);
    const link = screen.getByRole("link", { name: "admdongkor" });
    expect(link).toHaveAttribute("href", "https://github.com/vuski/admdongkor");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
