import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { TripStoreProvider, useTripStore, type TripStore } from "@/components/TripStoreProvider";
import type { Trip } from "@/types/trip";

// 테스트용 화면 틀: 진짜 TripStoreProvider(브라우저 메모리 저장소) 안에 페이지를 그린다
// 레이아웃처럼 저장소는 그대로 두고 페이지만 갈아 끼울 수 있어서, 저장·수정·삭제가 다른 화면에 실제로 남는지 볼 수 있다
export function renderStoreApp() {
  let grabbed: TripStore | null = null;

  // 저장소를 테스트에서 꺼내 쓰기 위한 빈 부품
  function StoreGrabber() {
    grabbed = useTripStore();
    return null;
  }

  const tree = (page?: ReactElement) => (
    <TripStoreProvider>
      <StoreGrabber />
      {page}
    </TripStoreProvider>
  );
  const result = render(tree());

  const store = (): TripStore => {
    if (!grabbed) throw new Error("저장소를 아직 꺼내지 못했어요.");
    return grabbed;
  };

  return {
    // 진짜 저장소. jest.spyOn으로 감싸면 불린 값도 볼 수 있다
    store,
    // 가짜 여행을 순서대로 저장하고, 저장소가 붙인 id가 담긴 여행을 돌려준다
    async addTrips(trips: Trip[]): Promise<Trip[]> {
      const saved: Trip[] = [];
      for (const { regionCode, startDate, endDate, diary, dongCodes } of trips) {
        saved.push(await store().createTrip({ regionCode, startDate, endDate, diary, dongCodes }));
      }
      return saved;
    },
    // 주소를 옮긴 것처럼 페이지만 바꾼다 (저장소는 그대로)
    showPage(page: ReactElement) {
      result.rerender(tree(page));
    },
  };
}
