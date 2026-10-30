import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewTripPage from "./page";
import RegionPage from "../../page";
import { renderStoreApp } from "../../../../../tests/fixtures/storeApp";
import { T1 } from "../../../../../tests/fixtures/trips";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../../../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../../../../tests/fixtures/codes")>("../../../../../tests/fixtures/codes")
    .FAKE_CODES,
);

// 가짜 주소: /regions/99010/trips/new, 그리고 어디로 가려 했는지
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: "99010" }),
  useRouter: () => ({ push: mockPush }),
}));

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

beforeEach(() => {
  // 날짜만 고정하고, 시간은 실제처럼 흐르게 둔다 (user-event가 멈추지 않게)
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  mockPush.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

const setupUser = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

// 진짜 저장소 안에 새 여행 기록 화면을 연다
function openNewTripPage() {
  const app = renderStoreApp();
  app.showPage(<NewTripPage />);
  return app;
}

describe("NewTripPage 화면", () => {
  it("UI-40 제목 '새 여행 기록', 칸 이름 '시작일 (필수)', '종료일', '여행일기', 종료일 안내, 버튼 '저장', '취소'가 보인다", () => {
    openNewTripPage();

    expect(screen.getByRole("heading", { name: "새 여행 기록" })).toBeInTheDocument();
    expect(screen.getByLabelText("시작일 (필수)")).toBeInTheDocument();
    expect(screen.getByLabelText("종료일")).toHaveAccessibleDescription(
      expect.stringContaining("비워 두면 당일치기로 저장돼요."),
    );
    expect(screen.getByLabelText("여행일기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });
});

describe("NewTripPage 저장", () => {
  it("UI-45 시작일만 넣고 저장하면 createTrip이 endDate: null, diary: '', dongCodes: []로 한 번 불린다", async () => {
    const user = setupUser();
    const app = openNewTripPage();
    const createTrip = jest.spyOn(app.store(), "createTrip");

    await user.type(screen.getByLabelText("시작일 (필수)"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(createTrip).toHaveBeenCalledTimes(1));
    expect(createTrip).toHaveBeenCalledWith({
      regionCode: "99010",
      startDate: "2026-10-01",
      endDate: null,
      diary: "",
      dongCodes: [],
    });
  });

  it("UI-51 저장에 성공하면 지역 화면으로 이동하고, 새 여행이 번호와 함께 목록에 보인다", async () => {
    const user = setupUser();
    const app = renderStoreApp();
    // 먼저 다녀온 여행이 하나 있다 (2026-05-01)
    await app.addTrips([T1]);
    app.showPage(<NewTripPage />);

    await user.type(screen.getByLabelText("시작일 (필수)"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/regions/99010"));

    // 지역 화면으로 옮긴다 (저장소는 그대로)
    app.showPage(<RegionPage />);
    const list = await screen.findByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    // 새 여행이 가장 늦게 시작했으므로 맨 위, 두 번째 여행
    expect(rows[0]).toHaveTextContent("두 번째 여행");
    expect(rows[0]).toHaveTextContent("2026.10.01 (당일치기)");
  });

  it("UI-55 '취소'를 누르면 지역 화면으로 돌아가고 저장하지 않는다", async () => {
    const user = setupUser();
    const app = openNewTripPage();
    const createTrip = jest.spyOn(app.store(), "createTrip");

    await user.type(screen.getByLabelText("시작일 (필수)"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(mockPush).toHaveBeenCalledWith("/regions/99010");
    expect(createTrip).not.toHaveBeenCalled();
    expect(await app.store().listTrips()).toHaveLength(0);
  });
});
