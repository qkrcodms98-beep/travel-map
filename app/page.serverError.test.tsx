import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./page";
import { MapViewportProvider } from "@/components/MapViewportProvider";
import type { TripStore } from "@/components/TripStoreProvider";
import { TripStoreError } from "@/lib/tripStoreError";
import type { Trip } from "@/types/trip";
import { FAKE_REGIONS_TOPOLOGY } from "../tests/fixtures/map";
import { T1 } from "../tests/fixtures/trips";

// v0.2 첫 화면: 서버에서 여행 목록을 못 받았을 때 (TEST_CASES UI-15)

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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// 지도 파일은 잘 불러온다
const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL]>();

beforeEach(() => {
  mockListTrips.mockReset();
  mockFetch.mockReset().mockResolvedValue({ ok: true, json: async () => FAKE_REGIONS_TOPOLOGY } as Response);
  global.fetch = mockFetch as typeof fetch;
});

const LOAD_ERROR = "여행 기록을 불러오지 못했어요. 지도는 빈 상태로 보여요.";
const regionA = () => screen.findByLabelText("테스트시 가구");

function renderHome() {
  return render(
    <MapViewportProvider>
      <HomePage />
    </MapViewportProvider>,
  );
}

describe("HomePage 서버 에러 (v0.2)", () => {
  it("UI-15 여행 목록을 못 불러오면 안내와 '다시 시도'가 보이고, 지도는 모두 흰색이다", async () => {
    mockListTrips.mockRejectedValue(new TripStoreError("INTERNAL_ERROR"));
    renderHome();

    expect(await screen.findByText(LOAD_ERROR)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(await regionA()).toHaveAttribute("data-color-stage", "none");
    // 여행이 없는 것과는 다르므로 첫 여행 안내는 보이지 않는다
    expect(screen.queryByText("다녀온 지역을 눌러 첫 여행을 기록해 보세요.")).not.toBeInTheDocument();
  });

  it("UI-15 서버에 닿지 못해도 같은 안내가 보인다", async () => {
    mockListTrips.mockRejectedValue(new TripStoreError("NETWORK_ERROR"));
    renderHome();

    expect(await screen.findByText(LOAD_ERROR)).toBeInTheDocument();
  });

  it("UI-15 '다시 시도'를 누르면 다시 불러오고, 성공하면 안내가 사라지고 지도가 칠해진다", async () => {
    const user = userEvent.setup();
    mockListTrips.mockRejectedValueOnce(new TripStoreError("NETWORK_ERROR")).mockResolvedValueOnce([T1]);
    renderHome();

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    const region = await regionA();
    await waitFor(() => expect(region).toHaveAttribute("data-color-stage", "once"));
    expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();
    expect(mockListTrips).toHaveBeenCalledTimes(2);
  });
});
