import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  // 레이아웃은 <html>을 그리므로, 테스트 화면(<div>) 안에 넣었다는 경고만 숨긴다. 다른 에러는 그대로 보인다
  beforeEach(() => {
    const originalError = console.error;
    jest.spyOn(console, "error").mockImplementation((message: unknown, ...rest: unknown[]) => {
      if (typeof message === "string" && message.includes("cannot be a child of")) return;
      originalError(message, ...rest);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("UI-90 어느 화면이든 내용 맨 아래에 지도 데이터 출처가 보인다", () => {
    render(
      <RootLayout>
        <main>화면 내용</main>
      </RootLayout>,
    );
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)");
    // 출처는 화면 내용보다 뒤(아래)에 있다
    const content = screen.getByRole("main");
    expect(content.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("UI-92 브라우저 탭 제목은 '트레이스'다", () => {
    expect(metadata.title).toBe("트레이스");
  });

  it("UI-114 아이폰 홈 화면 앱 켬, 이름 '트레이스', 아이폰 아이콘, 검색 사이트에 나오지 않음", () => {
    expect(metadata.appleWebApp).toEqual(expect.objectContaining({ capable: true, title: "트레이스" }));
    expect(metadata.icons).toEqual(expect.objectContaining({ apple: "/icons/apple-touch-icon.png" }));
    expect(metadata.robots).toEqual(expect.objectContaining({ index: false }));
  });
});
