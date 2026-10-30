import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegionPage from "./page";
import type { TripStore } from "@/components/TripStoreProvider";
import type { Trip } from "@/types/trip";
import { S1, S2, T1, T2, T3 } from "../../../tests/fixtures/trips";

// 진짜 코드 목록 파일 대신 가짜 코드 목록 (A = 99010 테스트시 가구, B = 99020 테스트시 나구)
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

// 가짜 주소: 주소의 지역 코드와, 어디로 가려 했는지
let mockRegionCode = "99010";
const mockPush = jest.fn<void, [string]>();
jest.mock("next/navigation", () => ({
  useParams: () => ({ regionCode: mockRegionCode }),
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockRegionCode = "99010";
  mockListTrips.mockReset().mockResolvedValue([]);
  mockPush.mockReset();
});

// 여행 목록의 각 줄 글자 (위에서부터)
async function tripRows(): Promise<string[]> {
  const list = await screen.findByRole("list");
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

describe("RegionPage 제목과 목록", () => {
  it("UI-20 /regions/99010의 제목은 코드 목록 파일의 이름 '테스트시 가구'다", async () => {
    render(<RegionPage />);
    expect(await screen.findByRole("heading", { name: "테스트시 가구" })).toBeInTheDocument();
  });

  it("UI-21 A에 T1, T2, T3가 있으면 위에서부터 세 번째, 두 번째, 첫 번째 여행이다", async () => {
    // 저장소는 순서를 보장하지 않으므로 뒤섞어서 준다
    mockListTrips.mockResolvedValue([T2, T3, T1]);
    render(<RegionPage />);

    const rows = await tripRows();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("세 번째 여행");
    expect(rows[1]).toContain("두 번째 여행");
    expect(rows[2]).toContain("첫 번째 여행");
    // 이 지역의 여행만 달라고 했다
    expect(mockListTrips).toHaveBeenCalledWith("99010");
  });

  it("UI-22 시작일이 같은 S1, S2는 위에서부터 S2 '두 번째 여행', S1 '첫 번째 여행'이다", async () => {
    mockListTrips.mockResolvedValue([S1, S2]);
    render(<RegionPage />);

    // 시작일이 같아 날짜 글자로는 구별되지 않으므로, 각 줄이 가리키는 상세 주소로 구별한다
    const list = await screen.findByRole("list");
    const links = within(list).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/regions/99010/trips/s2");
    expect(links[0]).toHaveTextContent("두 번째 여행");
    expect(links[1]).toHaveAttribute("href", "/regions/99010/trips/s1");
    expect(links[1]).toHaveTextContent("첫 번째 여행");
  });
});

describe("RegionPage 상태 문구", () => {
  it("UI-26 여행이 없으면 '아직 이 지역의 여행 기록이 없어요.'와 '새 여행 기록' 버튼이 보인다", async () => {
    render(<RegionPage />);
    expect(await screen.findByText("아직 이 지역의 여행 기록이 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 여행 기록" })).toBeInTheDocument();
  });

  it("UI-27 불러오는 중이면 '여행 목록을 불러오는 중이에요…'가 보인다", async () => {
    // 끝나지 않는 불러오기
    mockListTrips.mockReturnValue(new Promise<Trip[]>(() => {}));
    render(<RegionPage />);
    expect(await screen.findByText("여행 목록을 불러오는 중이에요…")).toBeInTheDocument();
  });

  it("UI-29 /regions/99999(없는 지역)는 안내와 '지도로 가기'가 보이고, 누르면 첫 화면으로 간다", async () => {
    const user = userEvent.setup();
    mockRegionCode = "99999";
    render(<RegionPage />);

    expect(await screen.findByText("지역을 찾을 수 없어요. 지도에서 다시 골라 주세요.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "지도로 가기" }));
    expect(mockPush).toHaveBeenCalledWith("/");
    // 없는 지역의 여행은 찾지 않는다
    expect(mockListTrips).not.toHaveBeenCalled();
  });
});

describe("RegionPage 이동", () => {
  it("UI-30 '‹ 뒤로'는 화면 읽기용 이름이 '뒤로 가기'이고 첫 화면(/)으로 간다", async () => {
    render(<RegionPage />);
    const back = await screen.findByRole("link", { name: "뒤로 가기" });
    expect(back).toHaveTextContent("‹ 뒤로");
    // 가짜 브라우저는 실제로 주소를 옮기지 않아서, 링크가 가리키는 주소를 확인한다
    expect(back).toHaveAttribute("href", "/");
  });

  it("UI-31 '새 여행 기록' 버튼은 /regions/99010/trips/new로 간다", async () => {
    mockListTrips.mockResolvedValue([T1]);
    render(<RegionPage />);
    expect(await screen.findByRole("link", { name: "새 여행 기록" })).toHaveAttribute(
      "href",
      "/regions/99010/trips/new",
    );
  });
});
