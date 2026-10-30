import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegionPage from "./page";
import type { TripStore } from "@/components/TripStoreProvider";
import { TripStoreError } from "@/lib/tripStoreError";
import type { Trip } from "@/types/trip";
import { T1 } from "../../../tests/fixtures/trips";

// v0.2 지역 화면: 서버에서 여행 목록을 못 받았을 때 (TEST_CASES UI-28)

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구)
jest.mock("../../../public/data/codes.json", () =>
  jest.requireActual<typeof import("../../../tests/fixtures/codes")>("../../../tests/fixtures/codes").FAKE_CODES,
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

jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: "99010" }),
  useRouter: () => ({ push: jest.fn() }),
}));

beforeEach(() => {
  mockListTrips.mockReset();
});

const LOAD_ERROR = "여행 목록을 불러오지 못했어요.";

describe("RegionPage 서버 에러 (v0.2)", () => {
  it("UI-28 여행 목록을 못 불러오면 안내와 '다시 시도'가 보인다", async () => {
    mockListTrips.mockRejectedValue(new TripStoreError("INTERNAL_ERROR"));
    render(<RegionPage />);

    expect(await screen.findByText(LOAD_ERROR)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    // 불러오는 중, 빈 목록 안내는 보이지 않는다
    expect(screen.queryByText("여행 목록을 불러오는 중이에요…")).not.toBeInTheDocument();
    expect(screen.queryByText("아직 이 지역의 여행 기록이 없어요.")).not.toBeInTheDocument();
  });

  it("UI-28 '다시 시도'를 누르면 다시 불러오고, 성공하면 목록이 보인다", async () => {
    const user = userEvent.setup();
    mockListTrips.mockRejectedValueOnce(new TripStoreError("NETWORK_ERROR")).mockResolvedValueOnce([T1]);
    render(<RegionPage />);

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("첫 번째 여행")).toBeInTheDocument();
    expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();
    expect(mockListTrips).toHaveBeenCalledTimes(2);
  });
});
