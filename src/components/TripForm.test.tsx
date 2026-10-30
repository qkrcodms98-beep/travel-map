import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripForm } from "@/components/TripForm";
import type { TripFormValue, TripInput } from "@/types/trip";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../tests/fixtures/codes")>("../../tests/fixtures/codes").FAKE_CODES,
);

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

// 저장소 대신 onSubmit이 불렸는지 본다 (새 여행 기록 화면에서는 이 자리에서 createTrip을 부른다)
const onSubmit = jest.fn<Promise<void>, [TripInput]>();

function renderForm(initialValue?: TripFormValue) {
  render(
    <TripForm mode="create" regionCode="99010" initialValue={initialValue} onSubmit={onSubmit} onCancel={jest.fn()} />,
  );
}

const value = (patch: Partial<TripFormValue>): TripFormValue => ({
  startDate: "",
  endDate: "",
  diary: "",
  dongCodes: [],
  ...patch,
});

beforeEach(() => {
  // 날짜만 고정하고, 시간은 실제처럼 흐르게 둔다 (user-event가 멈추지 않게)
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  onSubmit.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
const startField = () => screen.getByLabelText("시작일 (필수)");
const endField = () => screen.getByLabelText("종료일");

describe("TripForm 입력 검사", () => {
  it("UI-42 시작일 없이 저장하면 시작일 칸 아래 '시작일을 입력해 주세요.'가 보이고 저장하지 않는다", async () => {
    const user = setupUser();
    renderForm();

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(startField()).toHaveAccessibleDescription(expect.stringContaining("시작일을 입력해 주세요."));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("UI-43 종료일이 시작일보다 빠른 채 저장하면 종료일 칸 아래 안내가 보이고 저장하지 않는다", async () => {
    const user = setupUser();
    renderForm(value({ startDate: "2026-10-02", endDate: "2026-10-01" }));

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(endField()).toHaveAccessibleDescription(expect.stringContaining("종료일은 시작일보다 빠를 수 없어요."));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("UI-44 시작일과 종료일이 둘 다 형식에 안 맞으면 두 칸 아래에 각각 '날짜 형식이 올바르지 않아요.'가 보인다", async () => {
    const user = setupUser();
    // 가짜 브라우저의 날짜 칸은 틀린 글자를 쳐 넣을 수 없어서, 처음 값으로 넣는다
    renderForm(value({ startDate: "2026/05/03", endDate: "2026-13-01" }));

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(startField()).toHaveAccessibleDescription(expect.stringContaining("날짜 형식이 올바르지 않아요."));
    expect(endField()).toHaveAccessibleDescription(expect.stringContaining("날짜 형식이 올바르지 않아요."));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("TripForm 저장 중", () => {
  it("UI-50 저장을 누른 뒤 기다리는 동안 버튼은 '저장 중…'이고 누를 수 없으며, 두 번 눌러도 한 번만 저장한다", async () => {
    const user = setupUser();
    // 끝나지 않는 저장
    onSubmit.mockReturnValue(new Promise<void>(() => {}));
    renderForm(value({ startDate: "2026-10-01" }));

    const button = screen.getByRole("button", { name: "저장" });
    await user.click(button);
    await user.click(button);

    expect(button).toHaveTextContent("저장 중…");
    expect(button).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("TripForm 동네 목록 (v0.4)", () => {
  function renderWithDongs(dongs: React.ComponentProps<typeof TripForm>["dongs"]) {
    render(<TripForm mode="create" regionCode="99010" dongs={dongs} onSubmit={onSubmit} onCancel={jest.fn()} />);
  }

  it("UI-63 동네 목록을 불러오는 중이면 '동네 목록을 불러오는 중이에요…'", () => {
    renderWithDongs({ status: "loading" });

    expect(screen.getByText("동네 목록을 불러오는 중이에요…")).toBeInTheDocument();
  });

  it("UI-63 동네 목록을 못 불러오면 '동네 목록을 불러오지 못했어요.' + '다시 시도'. 누르면 다시 불러온다", async () => {
    const user = setupUser();
    const onRetry = jest.fn();
    renderWithDongs({ status: "error", onRetry });

    expect(screen.getByText("동네 목록을 불러오지 못했어요.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
