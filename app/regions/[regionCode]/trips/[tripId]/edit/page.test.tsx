import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditTripPage from "./page";
import RegionPage from "../../../page";
import { renderStoreApp } from "../../../../../../tests/fixtures/storeApp";
import { T1, T2, T3 } from "../../../../../../tests/fixtures/trips";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../../../../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../../../../../tests/fixtures/codes")>(
    "../../../../../../tests/fixtures/codes",
  ).FAKE_CODES,
);

// 가짜 주소: /regions/99010/trips/[tripId]/edit, 그리고 어디로 가려 했는지
let mockTripId = "";
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: "99010", tripId: mockTripId }),
  useRouter: () => ({ push: mockPush }),
}));

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

beforeEach(() => {
  // 날짜만 고정하고, 시간은 실제처럼 흐르게 둔다 (user-event가 멈추지 않게)
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  mockTripId = "";
  mockPush.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// 진짜 저장소에 T1, T2, T3를 넣고, 고를 여행(index)의 수정 화면을 연다
async function openEdit(index: number) {
  const app = renderStoreApp();
  const saved = await app.addTrips([T1, T2, T3]);
  mockTripId = saved[index].id;
  app.showPage(<EditTripPage />);
  // 여행을 불러와 폼이 보일 때까지 기다린다
  await screen.findByRole("heading", { name: "여행 수정" });
  return { app, tripId: saved[index].id };
}

describe("EditTripPage 보기", () => {
  it("UI-56 T2(종료일 null)를 열면 제목 '여행 수정', 종료일 칸이 비어 있고, 지역을 바꾸는 칸이 없다", async () => {
    await openEdit(1);

    expect(screen.getByLabelText("시작일 (필수)")).toHaveValue("2026-06-01");
    expect(screen.getByLabelText("종료일")).toHaveValue("");
    expect(screen.queryByLabelText(/지역/)).not.toBeInTheDocument();
  });
});

describe("EditTripPage 저장", () => {
  it("UI-57 T2의 일기만 고쳐 저장하면 updateTrip이 endDate: null로 불리고, 여행 상세로 이동한다", async () => {
    const user = setupUser();
    const { app, tripId } = await openEdit(1);
    const updateTrip = jest.spyOn(app.store(), "updateTrip");

    await user.type(screen.getByLabelText("여행일기"), "맑음");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(`/regions/99010/trips/${tripId}`));
    expect(updateTrip).toHaveBeenCalledTimes(1);
    expect(updateTrip).toHaveBeenCalledWith(tripId, {
      startDate: "2026-06-01",
      endDate: null,
      diary: "맑음",
      dongCodes: [],
    });
    // 진짜 저장소에 고친 일기가 남았다
    const saved = (await app.store().listTrips()).find((trip) => trip.id === tripId);
    expect(saved?.diary).toBe("맑음");
    expect(saved?.endDate).toBeNull();
  });

  it("UI-58 T3의 시작일을 2026-04-01로 고쳐 저장한 뒤 지역 화면을 보면 번호가 다시 매겨져 있다", async () => {
    const user = setupUser();
    const { app } = await openEdit(2);
    const updateTrip = jest.spyOn(app.store(), "updateTrip");

    const startField = screen.getByLabelText("시작일 (필수)");
    await user.clear(startField);
    await user.type(startField, "2026-04-01");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

    // 지역 화면으로 옮긴다 (저장소는 그대로)
    app.showPage(<RegionPage />);
    const list = await screen.findByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    // 최신순: T2(06-01), T1(05-01), T3(04-01)
    expect(rows[0]).toHaveTextContent("세 번째 여행");
    expect(rows[0]).toHaveTextContent("2026.06.01 (당일치기)"); // T2
    expect(rows[1]).toHaveTextContent("두 번째 여행");
    expect(rows[1]).toHaveTextContent("2026.05.01 ~ 05.02"); // T1
    expect(rows[2]).toHaveTextContent("첫 번째 여행");
    expect(rows[2]).toHaveTextContent("2026.04.01 ~ 07.03"); // T3
  });
});
