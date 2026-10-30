import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripDetailPage from "./page";
import RegionPage from "../../page";
import { renderStoreApp } from "../../../../../tests/fixtures/storeApp";
import { T1, T2, T3 } from "../../../../../tests/fixtures/trips";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../../../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../../../../tests/fixtures/codes")>("../../../../../tests/fixtures/codes")
    .FAKE_CODES,
);

// 가짜 주소: /regions/99010/trips/[tripId], 그리고 어디로 가려 했는지
let mockTripId = "";
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: "99010", tripId: mockTripId }),
  useRouter: () => ({ push: mockPush }),
}));

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");
const NOT_FOUND = "여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요.";

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

// 진짜 저장소에 T1, T2, T3를 넣고 T2의 상세 화면을 연다. 저장소가 붙인 T2의 id도 돌려준다
async function openT2Detail() {
  const app = renderStoreApp();
  const [, t2] = await app.addTrips([T1, T2, T3]);
  mockTripId = t2.id;
  app.showPage(<TripDetailPage />);
  return { app, t2Id: t2.id };
}

describe("TripDetailPage 보기", () => {
  it("UI-70 T2 상세는 제목 '두 번째 여행', 날짜 '2026.06.01 (당일치기)', 버튼 '수정', '삭제'가 보인다", async () => {
    const { t2Id } = await openT2Detail();

    expect(await screen.findByRole("heading", { name: "두 번째 여행" })).toBeInTheDocument();
    expect(screen.getByText("2026.06.01 (당일치기)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "수정" })).toHaveAttribute("href", `/regions/99010/trips/${t2Id}/edit`);
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("UI-74 없는 여행 id면 안내와 '지역 화면으로'가 보이고, 누르면 지역 화면으로 간다", async () => {
    const user = setupUser();
    const app = renderStoreApp();
    await app.addTrips([T1]);
    mockTripId = "no-such-trip";
    app.showPage(<TripDetailPage />);

    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "지역 화면으로" }));
    expect(mockPush).toHaveBeenCalledWith("/regions/99010");
  });

  it("UI-75 v0.1에서 새로고침하면(빈 저장소로 상세 주소를 엶) UI-74와 같은 안내가 보인다", async () => {
    // 새로고침하면 브라우저 메모리가 비므로, 아무것도 없는 저장소로 연다
    const app = renderStoreApp();
    mockTripId = "trip-before-refresh";
    app.showPage(<TripDetailPage />);

    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "지역 화면으로" })).toBeInTheDocument();
  });
});

describe("TripDetailPage 삭제", () => {
  it("UI-79 T1, T2, T3 중 T2를 지우면 지역 화면으로 가고, T3가 '두 번째 여행', T1이 '첫 번째 여행'이다", async () => {
    const user = setupUser();
    const { app, t2Id } = await openT2Detail();
    const deleteTrip = jest.spyOn(app.store(), "deleteTrip");

    await user.click(await screen.findByRole("button", { name: "삭제" }));
    const dialog = screen.getByRole("dialog", { name: "정말 지울까요?" });
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));

    // 진짜 저장소에서 T2를 지웠다
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/regions/99010"));
    expect(deleteTrip).toHaveBeenCalledTimes(1);
    expect(deleteTrip).toHaveBeenCalledWith(t2Id);

    // 지역 화면으로 옮긴다 (저장소는 그대로)
    app.showPage(<RegionPage />);
    const list = await screen.findByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("두 번째 여행");
    expect(rows[0]).toHaveTextContent("2026.07.01 ~ 07.03"); // T3
    expect(rows[1]).toHaveTextContent("첫 번째 여행");
    expect(rows[1]).toHaveTextContent("2026.05.01 ~ 05.02"); // T1
  });
});
