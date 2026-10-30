import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripForm } from "@/components/TripForm";
import { TripStoreError } from "@/lib/tripStoreError";
import type { TripInput } from "@/types/trip";

// v0.2 새 여행 기록·수정 폼: 저장이 서버에서 실패했을 때 (TEST_CASES UI-52~54)

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../tests/fixtures/codes")>("../../tests/fixtures/codes").FAKE_CODES,
);

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

// 저장소 대신 onSubmit이 실패하게 만든다
const onSubmit = jest.fn<Promise<void>, [TripInput]>();

beforeEach(() => {
  // 날짜만 고정하고, 시간은 실제처럼 흐르게 둔다 (user-event가 멈추지 않게)
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  onSubmit.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

// 화면 검사는 통과하는 값(시작일 2026-10-01)으로 저장을 누른다
async function submitValidForm() {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <TripForm
      mode="create"
      regionCode="99010"
      initialValue={{ startDate: "2026-10-01", endDate: "", diary: "", dongCodes: [] }}
      onSubmit={onSubmit}
      onCancel={jest.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "저장" }));
  return user;
}

describe("TripForm 서버 에러 (v0.2)", () => {
  it("UI-52 저장 결과가 INTERNAL_ERROR면 폼 위쪽에 '잠시 후 다시 시도해 주세요.'가 보이고 다시 저장할 수 있다", async () => {
    onSubmit.mockRejectedValueOnce(new TripStoreError("INTERNAL_ERROR"));
    await submitValidForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("잠시 후 다시 시도해 주세요.");
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("UI-53 서버에 닿지 못하면 폼 위쪽에 '인터넷 연결을 확인하고 다시 시도해 주세요.'가 보인다", async () => {
    onSubmit.mockRejectedValueOnce(new TripStoreError("NETWORK_ERROR"));
    await submitValidForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("인터넷 연결을 확인하고 다시 시도해 주세요.");
  });

  it("UI-54 서버가 START_DATE_IN_FUTURE를 돌려주면 시작일 칸 아래에 안내가 보인다", async () => {
    onSubmit.mockRejectedValueOnce(new TripStoreError("START_DATE_IN_FUTURE"));
    await submitValidForm();

    // 시작일 칸은 처음부터 있으므로, 안내가 붙을 때까지 기다린다
    await waitFor(() =>
      expect(screen.getByLabelText("시작일 (필수)")).toHaveAccessibleDescription(
        expect.stringContaining("시작일은 오늘까지만 고를 수 있어요."),
      ),
    );
  });

  it("실패한 뒤 다시 저장을 누르면 한 번 더 저장한다", async () => {
    onSubmit.mockRejectedValueOnce(new TripStoreError("INTERNAL_ERROR")).mockResolvedValueOnce(undefined);
    const user = await submitValidForm();
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
