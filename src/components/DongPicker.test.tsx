import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DongPicker } from "@/components/DongPicker";
import { getDongOptions } from "@/lib/dongCodes";
import type { DongCode } from "@/types/region";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010: 가동·나동, B = 99020: 다동)
jest.mock("../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../tests/fixtures/codes")>("../../tests/fixtures/codes").FAKE_CODES,
);

function renderPicker(selected: DongCode[] = []) {
  const onChange = jest.fn<void, [DongCode[]]>();
  render(<DongPicker options={getDongOptions("99010")} selected={selected} onChange={onChange} />);
  return { onChange };
}

describe("DongPicker", () => {
  it("UI-60 A 지역이면 칸 이름·안내와 A의 동네(가동, 나동)만 보인다", () => {
    renderPicker();

    expect(screen.getByRole("group", { name: "다녀온 동네" })).toBeInTheDocument();
    expect(screen.getByText("여러 곳을 고를 수 있어요.")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "가동" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "나동" })).toBeInTheDocument();
    expect(screen.queryByText("다동")).not.toBeInTheDocument();
  });

  it("UI-61 '가동'을 누르면 onChange(['9901010100'])", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    await user.click(screen.getByRole("checkbox", { name: "가동" }));

    expect(onChange).toHaveBeenCalledWith(["9901010100"]);
  });

  it("UI-62 고른 '가동'을 다시 누르면 onChange([]) (빠진다)", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(["9901010100"]);

    expect(screen.getByRole("checkbox", { name: "가동" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "가동" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
