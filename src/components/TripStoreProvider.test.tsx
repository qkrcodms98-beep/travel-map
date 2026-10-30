import { useEffect, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripStoreProvider, useTripStore } from "@/components/TripStoreProvider";
import { createMemoryTripStore } from "@/lib/memoryTripStore";
import { validateNewTrip } from "@/lib/tripRules";
import type { NewTrip, Trip } from "@/types/trip";

// 검사 규칙은 진짜로 동작하게 두고, 저장소가 불렀는지만 볼 수 있게 감싼다
jest.mock("@/lib/tripRules", () => {
  const actual = jest.requireActual<typeof import("@/lib/tripRules")>("@/lib/tripRules");
  return { ...actual, validateNewTrip: jest.fn(actual.validateNewTrip) };
});

// 기준 시각: 한국 2026-10-29 12:00 (TEST_CASES 2장)
const NOW = new Date("2026-10-29T03:00:00Z");

// 저장소는 진짜 코드 목록 파일로 지역을 검사하므로, 그 파일에 있는 코드를 쓴다 (서울 광진구)
const REGION = "11215";

const NEW_TRIP: NewTrip = { regionCode: REGION, startDate: "2026-05-01", endDate: null, diary: "", dongCodes: [] };

beforeEach(() => {
  // 날짜만 고정하고, 시간은 실제처럼 흐르게 둔다 (user-event가 멈추지 않게)
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  jest.mocked(validateNewTrip).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---- 페이지 흉내 (저장소만 쓰는 작은 화면들) ----

function FakeNewTripPage() {
  const store = useTripStore();
  const [saved, setSaved] = useState(false);
  return (
    <section aria-label="새 여행 기록">
      <button
        type="button"
        onClick={async () => {
          await store.createTrip(NEW_TRIP);
          setSaved(true);
        }}
      >
        저장
      </button>
      {saved && <p>저장했어요</p>}
    </section>
  );
}

function FakeHomePage() {
  const store = useTripStore();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  useEffect(() => {
    store.listTrips().then(setTrips);
  }, [store]);
  return <section aria-label="첫 화면">{trips && <p>전체 여행 {trips.length}개</p>}</section>;
}

function FakeRegionPage() {
  const store = useTripStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    store.listTrips(REGION).then(setTrips);
  }, [store]);
  return (
    <section aria-label="지역 화면">
      <ul>
        {trips.map((trip) => (
          <li key={trip.id}>{trip.startDate}</li>
        ))}
      </ul>
    </section>
  );
}

type PageName = "new" | "home" | "region";

// 레이아웃처럼 Provider는 그대로 두고, 안쪽 페이지만 갈아 끼운다
function FakeApp() {
  const [page, setPage] = useState<PageName>("new");
  return (
    <>
      <nav>
        <button type="button" onClick={() => setPage("home")}>
          첫 화면으로
        </button>
        <button type="button" onClick={() => setPage("region")}>
          지역 화면으로
        </button>
      </nav>
      <TripStoreProvider store={createMemoryTripStore()}>
        {page === "new" && <FakeNewTripPage />}
        {page === "home" && <FakeHomePage />}
        {page === "region" && <FakeRegionPage />}
      </TripStoreProvider>
    </>
  );
}

// createTrip을 불러 보고 에러를 화면에 보여 주는 작은 화면
function FakeCreateWithError({ input }: { input: NewTrip }) {
  const store = useTripStore();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            await store.createTrip(input);
          } catch (error) {
            // 저장소는 API와 같은 에러 코드를 code에 담아 던진다
            setErrorCode((error as { code?: string }).code ?? "코드 없음");
          }
          setCount((await store.listTrips()).length);
        }}
      >
        저장
      </button>
      {errorCode && <p role="alert">{errorCode}</p>}
      {count !== null && <p>전체 여행 {count}개</p>}
    </>
  );
}

describe("TripStoreProvider (v0.1)", () => {
  it("UI-93 새 여행 기록 → 첫 화면 → 지역 화면으로 이동해도 기록한 여행이 남아 있다", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FakeApp />);

    // 새 여행 기록
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("저장했어요")).toBeInTheDocument();

    // 첫 화면으로 이동: 앞 페이지는 사라지고 기록은 남는다
    await user.click(screen.getByRole("button", { name: "첫 화면으로" }));
    expect(screen.queryByRole("region", { name: "새 여행 기록" })).not.toBeInTheDocument();
    expect(await screen.findByText("전체 여행 1개")).toBeInTheDocument();

    // 지역 화면으로 이동
    await user.click(screen.getByRole("button", { name: "지역 화면으로" }));
    const region = screen.getByRole("region", { name: "지역 화면" });
    expect(await screen.findByRole("listitem")).toHaveTextContent("2026-05-01");
    expect(region).toContainElement(screen.getByRole("listitem"));
  });

  it("UI-94 시작일이 미래인 여행을 createTrip 하면 START_DATE_IN_FUTURE 에러가 나고 저장되지 않는다", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    // 오늘 = 2026-10-29, 시작일 = 2026-10-30 (내일)
    const future: NewTrip = { ...NEW_TRIP, startDate: "2026-10-30" };
    render(
      <TripStoreProvider store={createMemoryTripStore()}>
        <FakeCreateWithError input={future} />
      </TripStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("START_DATE_IN_FUTURE");
    expect(await screen.findByText("전체 여행 0개")).toBeInTheDocument();
    // 화면·서버와 같은 검사 규칙을 쓴다
    expect(validateNewTrip).toHaveBeenCalled();
  });
});
