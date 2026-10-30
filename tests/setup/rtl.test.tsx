import { render, screen } from "@testing-library/react";

// jsdom, React Testing Library, jest-dom이 함께 동작하는지 확인한다
describe("React Testing Library 설정", () => {
  it("그린 글자를 화면에서 찾는다", () => {
    render(<p>나만의 여행 지도</p>);
    expect(screen.getByText("나만의 여행 지도")).toBeInTheDocument();
  });
});
