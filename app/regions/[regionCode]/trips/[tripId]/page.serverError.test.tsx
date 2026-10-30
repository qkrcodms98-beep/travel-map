import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripDetailPage from "./page";
import { TripStoreError } from "@/lib/tripStoreError";
import { renderStoreApp } from "../../../../../tests/fixtures/storeApp";
import { T1, T2, T3 } from "../../../../../tests/fixtures/trips";

// v0.2 여행 상세: 삭제가 서버에서 실패했을 때 (TEST_CASES UI-80)

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../../../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../../../../tests/fixtures/codes")>("../../../../../tests/fixtures/codes")
    .FAKE_CODES,
);

let mockTripId = "";
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: "99010", tripId: mockTripId }),
  useRouter: () => ({ push: mockPush }),
}));

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  mockTripId = "";
  mockPush.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// 메모리 저장소에 T1, T2, T3를 넣고 T2 상세를 연다. 첫 삭제는 서버 에러로 실패하게 만든다
async function openT2WithFailingDelete() {
  const app = renderStoreApp();
  const [, t2] = await app.addTrips([T1, T2, T3]);
  mockTripId = t2.id;
  const deleteTrip = jest.spyOn(app.store(), "deleteTrip");
  deleteTrip.mockRejectedValueOnce(new TripStoreError("INTERNAL_ERROR"));
  app.showPage(<TripDetailPage />);
  return { deleteTrip, t2Id: t2.id };
}

async function confirmDelete(user: ReturnType<typeof setupUser>) {
  await user.click(await screen.findByRole("button", { name: "삭제" }));
  const dialog = screen.getByRole("dialog", { name: "정말 지울까요?" });
  await user.click(within(dialog).getByRole("button", { name: "삭제" }));
}

describe("TripDetailPage 삭제 실패 (v0.2)", () => {
  it("UI-80 삭제 결과가 INTERNAL_ERROR면 '잠시 후 다시 시도해 주세요.'와 '다시 시도'가 보이고 이동하지 않는다", async () => {
    const user = setupUser();
    await openT2WithFailingDelete();

    await confirmDelete(user);

    expect(await screen.findByText("잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    // 확인 창은 닫히고, 지역 화면으로 가지 않는다
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("UI-80 '다시 시도'를 누르면 다시 지우고, 성공하면 지역 화면으로 간다", async () => {
    const user = setupUser();
    const { deleteTrip, t2Id } = await openT2WithFailingDelete();
    await confirmDelete(user);

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/regions/99010"));
    expect(deleteTrip).toHaveBeenCalledTimes(2);
    expect(deleteTrip).toHaveBeenLastCalledWith(t2Id);
  });
});
