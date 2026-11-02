import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./page";
import { MapViewportProvider } from "@/components/MapViewportProvider";
import type { TripStore } from "@/components/TripStoreProvider";
import type { Trip } from "@/types/trip";
import { FAKE_REGIONS_TOPOLOGY } from "../tests/fixtures/map";
import { B1, T1, T2 } from "../tests/fixtures/trips";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (지역 A, B 두 개). 숫자 카드의 전체 지역 수가 2가 된다
jest.mock("../public/data/codes.json", () =>
  jest.requireActual<typeof import("../tests/fixtures/codes")>("../tests/fixtures/codes").FAKE_CODES,
);

// 가짜 저장소: 어떤 여행 목록을 돌려줄지 테스트마다 정한다
const mockListTrips = jest.fn<Promise<Trip[]>, [string?]>();
const mockStore: TripStore = {
  listTrips: (regionCode) => mockListTrips(regionCode),
  createTrip: jest.fn(),
  updateTrip: jest.fn(),
  deleteTrip: jest.fn(),
};
jest.mock("@/components/TripStoreProvider", () => ({
  useTripStore: () => mockStore,
}));

// 가짜 주소 이동: 어디로 가려 했는지만 기록한다
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// 가짜 지도 파일 불러오기
const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL]>();
const mapFileResponse = () => ({ ok: true, json: async () => FAKE_REGIONS_TOPOLOGY }) as Response;

beforeEach(() => {
  mockListTrips.mockReset().mockResolvedValue([]);
  mockPush.mockReset();
  mockFetch.mockReset().mockResolvedValue(mapFileResponse());
  global.fetch = mockFetch as typeof fetch;
});

const regionA = () => screen.findByLabelText("테스트시 가구");

// 지역들을 감싼 묶음(<g>)의 확대·이동 상태 (MapView.test.tsx와 같은 방식)
const mapTransformOf = (region: Element) => region.closest("g")?.getAttribute("transform");

// 휠로 확대하고, 바뀐 확대 상태를 돌려준다
async function zoomIn(): Promise<string | null | undefined> {
  const region = await regionA();
  fireEvent.wheel(region, { deltaY: -500 });
  await waitFor(() => expect(mapTransformOf(region)).not.toBe("translate(0,0) scale(1)"));
  return mapTransformOf(region);
}

function renderHome() {
  return render(
    <MapViewportProvider>
      <HomePage />
    </MapViewportProvider>,
  );
}

describe("HomePage 확대 상태 기억 (MapViewportProvider)", () => {
  it("UI-11 확대 → 지역 화면으로 이동 → 뒤로 돌아오면 돌아오기 전과 같은 확대 상태다", async () => {
    const user = userEvent.setup();
    const { rerender } = renderHome();
    const zoomed = await zoomIn();

    // 지역을 눌러 지역 화면으로 간다
    await user.click(await regionA());
    expect(mockPush).toHaveBeenCalledWith("/regions/99010");

    // 첫 화면이 사라졌다가(지역 화면) 다시 그려진다(뒤로 가기). Provider는 그대로다
    rerender(<MapViewportProvider>{null}</MapViewportProvider>);
    expect(screen.queryByLabelText("테스트시 가구")).not.toBeInTheDocument();
    rerender(
      <MapViewportProvider>
        <HomePage />
      </MapViewportProvider>,
    );

    expect(mapTransformOf(await regionA())).toBe(zoomed);
  });

  it("UI-12 확대한 뒤 Provider를 새로 만들면(새로고침) 처음 상태다", async () => {
    const { rerender } = render(
      <MapViewportProvider key="before">
        <HomePage />
      </MapViewportProvider>,
    );
    await zoomIn();

    // key가 바뀌면 Provider를 새로 만든다 (새로고침과 같음)
    rerender(
      <MapViewportProvider key="after">
        <HomePage />
      </MapViewportProvider>,
    );

    expect(mapTransformOf(await regionA())).toBe("translate(0,0) scale(1)");
  });
});

describe("HomePage 상태 문구", () => {
  it("UI-13 지도 파일을 불러오는 중이면 '지도를 불러오는 중이에요…'가 보인다", async () => {
    // 끝나지 않는 불러오기
    mockFetch.mockReturnValue(new Promise<Response>(() => {}));
    renderHome();
    expect(await screen.findByText("지도를 불러오는 중이에요…")).toBeInTheDocument();
  });

  it("UI-14 지도 파일을 못 불러오면 안내와 '다시 시도'가 보이고, 누르면 다시 불러온다", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("불러오기 실패"));
    renderHome();

    expect(await screen.findByText("지도를 불러오지 못했어요.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    // 두 번째에는 성공해서 지도가 보인다
    expect(await regionA()).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("지도를 불러오지 못했어요.")).not.toBeInTheDocument();
  });

  it("UI-16 여행이 하나도 없으면 첫 여행 안내가 보인다", async () => {
    renderHome();
    expect(await screen.findByText("다녀온 지역을 눌러 첫 여행을 기록해 보세요.")).toBeInTheDocument();
  });

  it("UI-17 여행이 있으면 첫 여행 안내가 없다", async () => {
    mockListTrips.mockResolvedValue([T1]);
    renderHome();

    // 여행을 불러와 A가 칠해질 때까지 기다린 뒤 확인한다
    const region = await regionA();
    await waitFor(() => expect(region).toHaveAttribute("data-color-stage", "once"));
    expect(screen.queryByText("다녀온 지역을 눌러 첫 여행을 기록해 보세요.")).not.toBeInTheDocument();
  });
});

// 숫자 카드: 이름 글자가 들어 있는 카드 전체
const statCard = (label: string) => screen.getByText(label).closest("div");

describe("HomePage 숫자 카드 (v0.5)", () => {
  it("UI-102 T1, T2, B1이면 다녀온 시·군·구 '2 / 2', 여행 '3번'", async () => {
    mockListTrips.mockResolvedValue([T1, T2, B1]);
    renderHome();

    expect(await screen.findByText("다녀온 시·군·구")).toBeInTheDocument();
    expect(statCard("다녀온 시·군·구")).toHaveTextContent("2 / 2");
    expect(statCard("여행")).toHaveTextContent("3번");
  });

  it("UI-103 여행 목록을 불러오는 중이면 숫자 카드가 없다", async () => {
    // 끝나지 않는 여행 목록
    mockListTrips.mockReturnValue(new Promise<Trip[]>(() => {}));
    renderHome();

    await regionA();
    expect(screen.queryByText("다녀온 시·군·구")).not.toBeInTheDocument();
    expect(screen.queryByText("여행")).not.toBeInTheDocument();
  });
});

describe("HomePage 앱 이름 (v1.0)", () => {
  it("UI-115 제목(h1) '트레이스' 아래에 '나만의 여행 지도'가 보인다", async () => {
    renderHome();
    await regionA();

    const title = screen.getByRole("heading", { level: 1, name: "트레이스" });
    const subtitle = screen.getByText("나만의 여행 지도");
    expect(title.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
