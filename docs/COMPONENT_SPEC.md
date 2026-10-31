# COMPONENT_SPEC - 나만의 여행 지도 (초안)

> 기준 문서: [IDEA.md](IDEA.md), [PRD.md](PRD.md), [TRD.md](TRD.md), [DATA_MODEL.md](DATA_MODEL.md), [API_SPEC.md](API_SPEC.md). 이 문서와 IDEA.md가 다르면 IDEA.md를 따른다.
> 범위: v0.1 ~ v1.0. 기능 ID(F-01 등)는 PRD.md를 따른다.

## 1. 화면 나누기

### 결정: 화면마다 주소가 다른 페이지로 나눈다

| IDEA.md 화면 | 주소 | 관련 기능 |
|---|---|---|
| 1. 전국 지도 (첫 화면) | `/` | F-01, F-08, F-12, F-13, F-16 |
| 2. 지역 화면 | `/regions/[regionCode]` | F-02, F-07 |
| 3. 새 여행 기록 | `/regions/[regionCode]/trips/new` | F-03, F-11 |
| 4. 여행 상세 | `/regions/[regionCode]/trips/[tripId]` | F-04, F-06 |
| (3번 화면 재사용) 여행 수정 | `/regions/[regionCode]/trips/[tripId]/edit` | F-05, F-11 |

- 여행 수정은 새 화면을 만들지 않고 "새 여행 기록" 화면의 입력 부품(`TripForm`)을 그대로 쓴다. 주소만 따로 둔다

### 이유
- **뒤로 가기가 자연스럽다.** 휴대폰의 뒤로 가기 버튼·제스처를 누르면 바로 앞 화면으로 돌아간다. 휴대폰 홈 화면에 설치한 앱(F-15)은 브라우저 주소창이 없어서 뒤로 가기가 특히 중요하다
- **새로고침해도 같은 화면에 있다.** 한 페이지 안에서 바꾸면 새로고침할 때마다 첫 화면으로 돌아간다 (v0.1은 기록은 사라지지만 화면 위치는 남는다. 그래서 v0.1에서 여행 상세를 새로고침하면 그 여행이 없어져 "여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요."가 뜬다. 이것이 정상이다)
- **Next.js App Router와 맞는다.** `app/` 폴더 구조가 곧 주소라서, 화면 하나가 폴더 하나다
- **주소에 지역 코드가 들어간다.** 여행 상세도 번호("두 번째 여행")를 계산하려면 그 지역의 목록이 필요한데(API_SPEC 1장), 주소에서 지역 코드를 바로 읽을 수 있다

### v0.1에서 페이지를 옮겨도 기록이 남게 하기
- v0.1은 기록을 브라우저 메모리에 둔다. 페이지마다 따로 들고 있으면 페이지를 옮길 때 사라진다
- 그래서 가장 바깥 레이아웃(`app/layout.tsx`)에 `TripStoreProvider`를 두고, 모든 페이지가 여기서 기록을 읽고 쓴다
- 새로고침하면 사라지는 것은 PRD대로다

## 2. 컴포넌트 트리

```
RootLayout (app/layout.tsx)
├─ TripStoreProvider > MapViewportProvider  여행 기록 읽기·쓰기 (F-09, F-10) > 지도 확대 상태·위치 기억 (F-16)
│  ├─ HomePage  /                          
│  │  ├─ MapView                           지도 그리기, 색칠, 확대·이동, 지역 누르기
│  │  ├─ CompletionBadge (v0.4)            지도 완성도 %
│  │  └─ StatusMessage                     로딩·빈 상태·에러
│  ├─ RegionPage  /regions/[regionCode]
│  │  ├─ PageHeader                        지역 이름, 뒤로 가기
│  │  ├─ TripList
│  │  │  └─ TripListItem (여러 개)         "첫 번째 여행", 날짜
│  │  ├─ 새 여행 기록 버튼 (링크)
│  │  └─ StatusMessage
│  ├─ NewTripPage  /regions/[regionCode]/trips/new
│  │  ├─ PageHeader
│  │  └─ TripForm (mode="create")
│  │     ├─ DateFields                     시작일, 종료일
│  │     ├─ DiaryField                     여행일기, 남은 글자 수
│  │     ├─ DongPicker (v0.4)              동네 여러 개 고르기
│  │     └─ FormError                      폼 전체 에러
│  ├─ TripDetailPage  /regions/[regionCode]/trips/[tripId]
│  │  ├─ PageHeader
│  │  ├─ TripDetail                        날짜, 동네, 일기 (번호는 PageHeader 제목)
│  │  ├─ 수정 버튼 (링크)
│  │  ├─ DeleteTripButton
│  │  │  └─ ConfirmDialog                  "정말 지울까요?"
│  │  └─ StatusMessage
│  └─ EditTripPage  /regions/[regionCode]/trips/[tripId]/edit
│     ├─ PageHeader
│     ├─ TripForm (mode="edit")
│     └─ StatusMessage
└─ AttributionFooter                       지도 데이터 출처 (CC BY 4.0)
```

- 페이지 컴포넌트(`~Page`)는 `app/` 아래에, 나머지 부품은 `src/components/`에 둔다
- 부품은 계산을 직접 하지 않는다. 계산은 4장의 `src/lib` 함수를 불러서 쓴다

## 3. 컴포넌트별 명세

공통으로 쓰는 타입은 DATA_MODEL.md 4장(`Trip`, `NewTrip`, `TripWithNumber`, `RegionCode`, `DongCode`, `DateString`)을 따른다.

### 3-1. TripStoreProvider — F-09, F-10

여행 기록을 읽고 쓰는 곳을 하나로 모은다. 부품들은 이 안에서 꺼낸 함수만 쓴다.

```ts
interface TripStore {
  listTrips(regionCode?: RegionCode): Promise<Trip[]>;
  createTrip(input: NewTrip): Promise<Trip>;
  updateTrip(id: string, input: Omit<NewTrip, "regionCode">): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
}

interface TripStoreProviderProps {
  children: React.ReactNode;
  store?: TripStore; // 빼면 API 저장소 (v0.2~). 테스트에서는 createMemoryTripStore()를 넣는다. 처음 받은 저장소를 계속 쓴다
}

// 부품은 이 함수로 저장소를 꺼낸다. TripStoreProvider 바깥에서 부르면 에러를 던진다
function useTripStore(): TripStore;

// 저장소 함수가 실패하면 이 에러를 던진다 (Promise가 reject된다)
// code는 API_SPEC 2장의 에러 코드. 화면은 code만 보고 5장 문구를 고른다 (getErrorMessage)
class TripStoreError extends Error {
  code: string; // 예: "START_DATE_IN_FUTURE", "TRIP_NOT_FOUND"
}
```

- `TripStoreProvider`, `useTripStore`, `TripStoreError`는 모두 `src/components/TripStoreProvider.tsx`에서 내보낸다
- 실패를 받는 쪽은 `catch (error)`에서 `error.code`를 읽는다. v0.2부터는 API 응답의 `error.code`를 그대로 담아 던지므로 받는 쪽은 고치지 않는다

| 버전 | 안에서 하는 일 |
|---|---|
| v0.1 | 브라우저 메모리에 저장한다. 입력 검사도 화면의 Zod 규칙(`validateNewTrip`, `validateTripUpdate`)으로 하고, 실패하면 API_SPEC과 같은 에러 코드를 낸다 |
| v0.2 ~ | FastAPI 백엔드의 4개 주소(API_SPEC, `NEXT_PUBLIC_API_URL` 뒤에 붙임)를 부른다(`src/lib/tripApi.ts`의 `apiTripStore`). 서버 검사는 백엔드가 한다. 서버에 닿지 못하면 `NETWORK_ERROR`를 던진다 |

- v0.1의 메모리 저장소는 `src/lib/memoryTripStore.ts`의 `createMemoryTripStore()`로 남겨, 테스트에서 `store`로 넣어 쓴다
- `TripStore` 타입은 `src/types/trip.ts`, `TripStoreError`는 `src/lib/tripStoreError.ts`에 두고 이 파일에서 다시 내보낸다

- 버전이 바뀌어도 `TripStore`의 모양과 에러 코드는 같다. 그래서 v0.2에서 저장 위치를 바꿔도 페이지와 부품은 고치지 않는다 (TRD 3장)

### 3-2. MapView — F-01, F-08, F-12, F-16

```ts
interface MapViewProps {
  regions: RegionFeature[];                       // 시·군·구 모양 (public/data/)
  visitCounts: Record<RegionCode, number>;        // countVisits()의 결과
  onRegionClick: (regionCode: RegionCode) => void;
  viewport: MapViewport | null;                   // 기억해 둔 확대 상태·위치. null이면 전국이 보이게
  onViewportChange: (viewport: MapViewport) => void;
  sidoBorders?: GeoJSON.MultiLineString;          // (v0.5) 시·도 경계선. 첫 화면이 지도 파일에서 topojson mesh로 만든다 (10-6)
}

interface MapViewport {
  scale: number; // 확대 배율 (1 = 전국)
  x: number;     // 옮긴 거리 (가로)
  y: number;     // 옮긴 거리 (세로)
}

interface RegionFeature {
  code: RegionCode;
  name: string;              // 예: "대구광역시 군위군"
  geometry: GeoJSON.Geometry;
}
```

| 사용자 동작 | 결과 |
|---|---|
| 지도를 본다 | 지역마다 `getColorStage()`의 결과로 색을 칠한다. 0번 흰색, 1번 연두색, 2번 이상 진한 초록 (v0.4부터 지형 무늬) |
| 두 손가락으로 벌리기·오므리기, 마우스 휠 | 지도를 확대·축소한다 (F-16) |
| 한 손가락 끌기, 마우스 끌기 | 지도를 옮긴다 (F-16) |
| 지역을 짧게 누른다 | `onRegionClick(지역 코드)`를 부른다 → 지역 화면으로 이동 |
| 끌다가 손을 뗀다 | 지역을 누른 것으로 치지 않는다. 옮기려다 다른 화면으로 넘어가는 실수를 막는다 |
| 키보드 Tab으로 지역에 간 뒤 Enter 또는 Space | 지역을 누른 것과 같다 (`onRegionClick`) |

- `MapViewProps`, `MapViewport`, `RegionFeature`는 `src/components/MapView.tsx`에서 내보낸다
- **역할 나누기:** d3는 모양 계산(투영, path 글자, 확대 계산)만 하고, `<path>` 요소는 React(JSX)가 그린다
  - 휠과 손가락(끌기, 두 손가락 확대)은 d3 확대 기능이 받는다
  - 마우스 끌기는 React의 pointer 이벤트로 받아 움직인 거리만 재고, 옮긴 결과 계산은 d3(`translateBy`)가 한다. 끌었으면 손을 뗄 때 생기는 클릭은 무시한다 (UI-06)
  - 끌다가 지도 밖으로 나가도 놓치지 않게 마우스를 `<svg>`에 붙잡는다(`setPointerCapture`). 붙잡으면 브라우저가 클릭을 지역이 아닌 `<svg>`에서 일으키므로, 누를 때 어느 지역인지 기억해 두고 클릭은 `<svg>` 한 곳에서 처리한다 (UI-98)
- 각 지역 `<path>`에는 아래를 붙인다
  - `aria-label`: 지역 이름 (화면 읽기용, 테스트도 이 이름으로 찾는다)
  - `data-color-stage`: `getColorStage()`의 결과 `"none"` / `"once"` / `"many"` (테스트는 색 대신 이 값을 본다)
  - `role="button"`, `tabIndex={0}`: 키보드로 고를 수 있게
- 지역들은 하나의 `<g>`로 감싸고, 그 `<g>`의 `transform`에 확대 상태를 d3 글자 모양 그대로 적는다
  - 예: `viewport = { scale: 2, x: 10, y: 20 }` → `transform="translate(10,20) scale(2)"`
  - 처음 상태(`viewport = null`)는 `transform="translate(0,0) scale(1)"`
- **확대·이동(F-16)은 MapView가 맡는다.** d3의 확대 기능을 쓴다
- 가장 작게는 전국이 한 화면에 보이고, 가장 크게는 서울의 구를 손가락으로 정확히 누를 수 있을 만큼 키운다 (PRD 성공 기준). 정확한 배율은 만들면서 정한다
- **다른 화면에 갔다가 첫 화면으로 돌아오면 확대 상태와 위치를 그대로 둔다.** MapView는 화면을 옮기면 사라지므로, 확대 상태는 가장 바깥 레이아웃의 `MapViewportProvider`에 기억해 둔다
- 새로고침하면 기억이 사라지고 전국이 보이는 처음 상태로 돌아간다

**지형 무늬 (F-12, v0.4)**
- `"many"` 지역은 `fill="url(#terrain-pattern)"`으로 칠한다. 무늬는 `<svg>` 안 `<defs>`의 `<pattern id="terrain-pattern">` 하나다 (UI-04는 이 `fill`을 본다)
- 무늬는 **전국 지도 크기의 그림 한 장**이다. `patternUnits="userSpaceOnUse"`로 지도 판(600×800)과 같은 자리에 깔아서, 각 지역에는 실제 그 자리의 지형이 보인다 (강원도에는 태백산맥, 제주에는 한라산). 확대하면 `<g>`와 함께 커진다
- 그림은 브라우저에서 처음 그릴 때 캔버스(`<canvas>`)에 한 번 그리고, 그 결과(PNG 글자)를 무늬 안 `<image>`로 넣는다. 캔버스를 쓸 수 없는 곳(테스트용 가짜 브라우저)에서는 그림 없이 진한 초록 바탕만 보인다
- 그림 크기는 지도 판의 2배(1200×1600)다. 더 크면 처음 그릴 때 느려진다
- (v0.5) 범례의 "2번 이상" 견본에도 이 그림을 쓰므로, 2번 이상 간 지역이 없어도 그림을 그린다. 범례는 MapView가 지도 왼쪽 아래에 그린다 (10-5)
- 지형 계산은 `src/lib/terrain.ts`의 순수 함수로 둔다 (4장). 무작위 값을 쓰지 않으므로 **같은 좌표면 늘 같은 무늬**다
  - 높이 = 실제 산맥 자리(태백·소백·차령·노령산맥, 광주산맥, 한라산, 울릉도 성인봉 등을 경도·위도 선과 점으로 적음) + 노이즈(울퉁불퉁함)
  - 색 = 높이별 색(낮은 곳 논밭 연두·갈색, 산 짙은 초록, 높은 능선 갈색) × 북서쪽에서 빛을 비춘 그림자

### 3-2-1. MapViewportProvider — F-16

```ts
interface MapViewportProviderProps {
  children: React.ReactNode;
}

// 첫 화면은 이 함수로 확대 상태를 꺼내 MapView에 넘기고, 바뀌면 setViewport로 기억한다
// MapViewportProvider 바깥에서 부르면 에러를 던진다
function useMapViewport(): {
  viewport: MapViewport | null; // 아직 확대·이동한 적 없으면 null
  setViewport: (viewport: MapViewport) => void;
};
```

- `MapViewportProvider`, `useMapViewport`는 `src/components/MapViewportProvider.tsx`에서 내보낸다
- 가장 바깥 레이아웃에서 `TripStoreProvider` 안쪽에 둔다 (2장 트리)
- 브라우저 메모리에만 기억한다. 새로고침하면 사라진다

### 3-2-2. 첫 화면 (HomePage, `app/page.tsx`) — F-01, F-08, F-16

- 지도 파일은 브라우저에서 `fetch("/data/regions.topo.json")`으로 불러온다 (`public/data/`의 파일은 이 주소로 열린다)
- 불러온 TopoJSON의 `objects.regions`를 topojson-client로 풀어 `RegionFeature[]`로 바꾼다. 각 지역의 `properties`에는 `code`, `name`이 있다
- 여행 목록은 `useTripStore().listTrips()`로 읽고, `countVisits()`로 `visitCounts`를 만든다
- 지역을 누르면 `/regions/[지역 코드]`로 이동한다
- 불러오는 중·실패·여행 없음 문구는 6장, 모양은 `StatusMessage`를 따른다

### 3-3. CompletionBadge — F-13 (v0.4)

```ts
interface CompletionBadgeProps {
  percent: number; // calcCompletion()의 결과 (0 ~ 100)
}
```

- 첫 화면 위쪽에 "지도 완성도 12.3%"처럼 보여 준다. 글자는 `formatPercent()`로 만든다
  - 0이면 "0%"
  - 0보다 크고 0.1 미만이면 "0.1% 미만" (서울 중구처럼 작은 지역 하나만 가 봐도 "0.0%"로 보이지 않게)
  - 100이면 "100%". 100은 **모든 지역을 가 봤을 때만** 나온다 (`calcCompletion`이 정한다)
  - 그 밖에는 소수점 첫째 자리까지 **버림** ("12.39" → "12.3%", "99.96" → "99.9%"). 다 다녀오지 않았는데 반올림으로 "100.0%"가 되는 일을 막는다
- 누르는 동작은 없다
- `src/components/CompletionBadge.tsx`에서 내보낸다
- 첫 화면은 `calcCompletion(방문 횟수가 있는 지역 코드, REGION_AREAS)`로 `percent`를 만든다
  - 넓이는 `src/lib/regionAreas.ts`가 `public/data/areas.json`(4KB)을 읽어 `REGION_AREAS`로 내보낸다. 넓이 파일을 읽는 유일한 곳이다
  - 파일이 작아서 `codes.json`처럼 화면 코드에 함께 묶는다 (따로 불러오지 않으므로 불러오는 중·실패 상태가 없다)
- 여행 목록을 다 불러온 뒤에만 보여 준다. 불러오는 중이거나 실패했을 때는 숨긴다 (실패했는데 "0%"로 보이면 기록이 사라진 것처럼 보이기 때문)
- (v0.5) 카드 모양으로 바꾸고 진행 막대를 붙인다. 막대는 `role="progressbar"`, 화면 읽기용 이름은 "지도 완성도", `aria-valuenow`는 `percent`(0~100)다. 글자는 지금처럼 한 요소 안에 "지도 완성도 12.3%"로 두고 크기만 다르게 한다 (이름은 작게, 숫자는 크게). 모양은 10장

### 3-4. PageHeader — F-02, F-03, F-04, F-05

```ts
interface PageHeaderProps {
  title: string;     // 아래 표
  backHref: string;  // 뒤로 가기 버튼이 갈 주소
  subtitle?: string; // (v0.5) 제목 아래 작은 글씨. 아래 표
}
```

| 화면 | 제목 (`title`) | 뒤로 가기가 갈 곳 |
|---|---|---|
| 지역 화면 | 지역 이름 (예: "대구광역시 군위군") | 첫 화면 |
| 새 여행 기록 | "새 여행 기록" | 지역 화면 |
| 여행 상세 | 여행 번호 (예: "두 번째 여행") | 지역 화면 |
| 여행 수정 | "여행 수정" | 여행 상세 |

- 뒤로 가기 버튼은 "‹ 뒤로"로 보여 주고, 화면 읽기 프로그램용 이름은 "뒤로 가기"로 한다
  - (v0.5) "‹ 뒤로" 글자 대신 44px 동그란 버튼 안의 화살표 그림으로 바꾼다. 그림은 `aria-hidden`이고, 화면 읽기용 이름은 "뒤로 가기" 그대로다

| 화면 (v0.5) | 부제 (`subtitle`) |
|---|---|
| 지역 화면 | "여행 3번" (여행이 1개 이상일 때만) |
| 새 여행 기록 | 지역 이름 (번호는 시작일로 정해져서 고르기 전에는 알 수 없으므로 넣지 않는다) |
| 여행 상세 | 지역 이름 |
| 여행 수정 | "지역 이름 · 두 번째 여행" |

- 뒤로 가기는 `backHref`로 가는 링크(`<a href>`)다. 제목은 `<h1>`이다
- `src/components/PageHeader.tsx`에서 내보낸다

| 사용자 동작 | 결과 |
|---|---|
| 뒤로 가기 버튼을 누른다 | `backHref`로 이동한다 (지역 화면 → 첫 화면, 상세 → 지역 화면 등) |

- 지역 이름은 코드 목록 파일(TRD 6장)에 있는 이름을 쓴다. 지도 파일 전체를 읽지 않아도 되어 가볍다

### 3-5. TripList, TripListItem — F-02, F-07

```ts
interface TripListProps {
  trips: TripWithNumber[]; // assignTripNumbers() → sortTripsNewestFirst() 순서로 넣는다
  regionCode: RegionCode;
}

interface TripListItemProps {
  trip: TripWithNumber;
  href: string; // 여행 상세 주소
  dongNames: string[]; // (v0.5) 다녀온 동네 이름. TripList가 getDongNames()로 만든다
}
```

| 사용자 동작 | 결과 |
|---|---|
| 목록을 본다 | 최신순으로 첫 줄에 번호("세 번째 여행"), 둘째 줄에 날짜("2026.05.03 ~ 05.04")를 보여 준다. 날짜 글자는 `formatTripDates()`로 만든다 (4장) |
| 여행 하나를 누른다 | 여행 상세로 이동한다 |
| "새 여행 기록" 버튼을 누른다 | 새 여행 기록 화면으로 이동한다 |

- 번호 글자는 `formatTripNumber()`로 만든다
- (v0.5) 셋째 줄에 기간과 동네를 보여 준다 ("2박 3일 · 황남동, 보덕동"). 10-5를 따른다
- TripList는 `<ul>`, 여행 한 줄은 `<li>`다. TripListItem은 여행 상세로 가는 링크(`<a href>`) 하나로, 안에 번호와 날짜가 들어 있다
- 여행 상세 주소는 `/regions/[지역 코드]/trips/[여행 id]`다
- `src/components/TripList.tsx`, `src/components/TripListItem.tsx`에서 각각 내보낸다

### 3-5-1. 지역 화면 (RegionPage, `app/regions/[regionCode]/page.tsx`) — F-02, F-07

- 브라우저에서 도는 화면이다. 주소의 지역 코드는 `useParams()`로 읽는다
- 지역 이름은 `src/lib/regionCodes.ts`의 `getRegionName()`으로 찾는다. 이 파일이 `public/data/codes.json`(코드 목록 파일)을 읽는 유일한 곳이고, TripStoreProvider도 여기서 `REGION_CODES`를 가져다 쓴다
- 코드 목록 파일에 없는 지역이면 여행 목록을 불러오지 않고, 6장의 "지역을 찾을 수 없어요…" 문구와 "지도로 가기" 버튼을 보여 준다. 이 버튼은 `StatusMessage`의 버튼이고, 누르면 `/`로 이동한다
- 여행 목록은 `useTripStore().listTrips(지역 코드)`로 읽고, `assignTripNumbers()` → `sortTripsNewestFirst()` 순서로 번호를 매기고 줄 세운다
- "새 여행 기록"은 `/regions/[지역 코드]/trips/new`로 가는 링크다. 여행이 있든 없든 화면에 늘 하나만 있다
  - 여행이 없을 때는 6장의 "아직 이 지역의 여행 기록이 없어요." 문구만 `StatusMessage`로 보여 주고, 버튼은 따로 만들지 않는다 (위 링크를 쓴다)

### 3-6. TripForm — F-03, F-05, F-11

새 여행 기록과 여행 수정에 같이 쓴다.

```ts
interface TripFormValue {
  startDate: DateString | "";   // 아직 안 골랐으면 ""
  endDate: DateString | "";     // 비우면 당일치기
  diary: string;
  dongCodes: DongCode[];
}

interface TripFormProps {
  mode: "create" | "edit";
  regionCode: RegionCode;
  initialValue?: TripFormValue;                 // 수정할 때 지금 값
  dongs?: DongListState;                        // v0.4부터. 그 지역의 동네 목록 상태 (빼면 동네 칸이 없다)
  onSubmit: (input: TripInput) => Promise<void>;  // 바꾼 뒤의 값 (아래)
  onCancel: () => void;
}

// 동네 목록 상태 (v0.4). 페이지가 useDongOptions()로 만들어 넘긴다
type DongListState =
  | { status: "loading" }                          // "동네 목록을 불러오는 중이에요…"
  | { status: "error"; onRetry: () => void }       // "동네 목록을 불러오지 못했어요." + "다시 시도"
  | { status: "ready"; options: DongOption[] };    // DongPicker를 보여 준다

// 저장할 때 보내는 값. NewTrip에서 지역 코드를 뺀 모양
type TripInput = Omit<NewTrip, "regionCode">;
```

**종료일 `""` ↔ `null` 바꾸기**
- 폼 안에서는 종료일을 비우면 `""`이다. 입력 칸은 `null`을 담을 수 없기 때문이다
- 저장 버튼을 누르면 **TripForm이 `toTripInput()`(4장)으로 `""`을 `null`로 바꾼 다음** Zod로 검사하고 `onSubmit`에 넘긴다. 그래서 TripForm 바깥(TripStore, API, DB)에서는 항상 `null`이다
- 수정 화면을 열 때는 반대로 **EditTripPage가 `toFormValue()`(4장)로 `null`을 `""`로 바꿔** `initialValue`에 넣는다

| 사용자 동작 | 결과 |
|---|---|
| "저장" 버튼을 누른다 | `toTripInput()`으로 바꾼 뒤 Zod로 검사한다. 통과하면 `onSubmit`을 부르고, 버튼은 "저장 중…"으로 바뀌며 다시 누를 수 없다 |
| 규칙을 어기고 저장을 누른다 | 저장하지 않고, 해당 칸 아래에 5장의 문구를 보여 준다 |
| 저장에 성공한다 (새 여행) | 지역 화면으로 이동한다. 목록을 다시 받아 번호가 붙은 새 여행이 보인다 (API_SPEC 3-2) |
| 저장에 성공한다 (수정) | 여행 상세로 이동한다 |
| "취소" 버튼을 누른다 | `onCancel`을 부른다 → 앞 화면으로 돌아간다 |

- 검사 함수: `mode="create"`는 `validateNewTrip`(지역 코드를 붙이고 `REGION_CODES`로), `mode="edit"`는 `validateTripUpdate`. 지금 시각은 저장을 누른 때의 `new Date()`
- 에러 자리는 5장 표를 따른다. 검사는 먼저 걸린 코드 하나만 주므로, `INVALID_DATE`일 때는 `isRealDate`(4장)로 두 날짜를 각각 보고 틀린 칸 모두에 문구를 붙인다. 칸에 붙일 수 없는 코드는 폼 위쪽 FormError에 보여 준다
- 칸 아래 문구는 입력 칸의 `aria-describedby`로 이어서, 화면 읽기 프로그램이 칸과 함께 읽게 한다
- `mode="edit"`일 때는 지역을 바꾸는 칸이 없다 (API_SPEC 3-3)
- 버튼 글자는 새 여행 기록과 수정 모두 "저장", "취소"다
- 동네 (v0.4): `dongs`가 `"ready"`면 DongPicker를 보여 주고, `"loading"`·`"error"`면 그 자리에 6장 문구를 `StatusMessage`로 보여 준다 (UI-63). 동네를 못 불러와도 날짜·일기는 저장할 수 있다 (고른 동네는 그대로 보낸다)
- 동네 검사는 `DONG_REGIONS`(4장 `src/lib/dongCodes.ts`)로 한다. `INVALID_DONG_CODE`·`DUPLICATE_DONG_CODE`는 동네 선택 아래(`DongPicker`의 `error`)에 보여 주고, 동네 칸이 없으면 폼 위쪽에 보여 준다

### 3-6-1. 새 여행 기록 화면 (NewTripPage, `app/regions/[regionCode]/trips/new/page.tsx`) — F-03

- 브라우저에서 도는 화면이다. 주소의 지역 코드는 `useParams()`로 읽는다
- 동네 목록은 `useDongOptions(지역 코드)`(`src/components/useDongOptions.ts`)로 받아 `TripForm`의 `dongs`에 넣는다 (v0.4)
  - `src/lib/dongCodes.ts`를 따로 떼어 불러오므로(`import()`) 잠깐 불러오는 중이 있고, 불러오기에 실패할 수 있다. "다시 시도"를 누르면 다시 불러온다
- 저장: `useTripStore().createTrip({ regionCode, ...input })`가 끝나면 지역 화면(`/regions/[지역 코드]`)으로 이동한다
- 취소: 지역 화면으로 이동한다 (뒤로 가기 버튼과 같은 곳. 주소로 바로 들어온 경우에도 앱 밖으로 나가지 않게 `router.back()` 대신 주소로 간다)

### 3-6-2. 여행 수정 화면 (EditTripPage, `app/regions/[regionCode]/trips/[tripId]/edit/page.tsx`) — F-05

- 여행은 여행 상세 화면(3-11-1)과 같은 방법으로 찾는다. 찾지 못하면 같은 문구와 "지역 화면으로" 버튼을 보여 준다
- 찾으면 `toFormValue(여행)`을 `TripForm`(`mode="edit"`)의 `initialValue`로 넣는다
- 동네 목록은 새 여행 기록 화면과 같이 `useDongOptions(지역 코드)`로 받는다 (v0.4)
- 저장: `useTripStore().updateTrip(여행 id, input)`이 끝나면 여행 상세로 이동한다
- 취소: 여행 상세로 이동한다 (뒤로 가기 버튼과 같은 곳)

### 3-7. DateFields — F-03, F-05

```ts
interface DateFieldsProps {
  startDate: DateString | "";
  endDate: DateString | "";
  today: DateString;             // getTodayInSeoul()의 결과
  startDateError?: string;
  endDateError?: string;
  onChange: (next: { startDate: DateString | ""; endDate: DateString | "" }) => void;
}
```

| 사용자 동작 | 결과 |
|---|---|
| 시작일을 고른다 | 달력에서 오늘(한국 시간) 뒤의 날짜는 고를 수 없다 |
| 종료일을 고른다 | 미래 날짜도 고를 수 있다 (API_SPEC 5장) |
| 종료일을 비운다 | 당일치기로 저장된다 |
| 종료일이 시작일보다 빠른 채로 저장한다 | 종료일 칸 아래에 "종료일은 시작일보다 빠를 수 없어요."를 보여 준다 |
| 날짜를 형식에 안 맞게 넣고 저장한다 | 틀린 칸 아래에 각각 "날짜 형식이 올바르지 않아요."를 보여 준다. 둘 다 틀리면 두 칸 모두에 보여 준다 |

| 글자 | 문구 |
|---|---|
| 시작일 칸 이름 | 시작일 (필수) |
| 종료일 칸 이름 | 종료일 |
| 종료일 칸 아래 안내 | 비워 두면 당일치기로 저장돼요. |

### 3-8. DiaryField — F-03, F-05

```ts
interface DiaryFieldProps {
  value: string;
  maxLength: number; // 2000
  error?: string;
  onChange: (value: string) => void;
}
```

| 사용자 동작 | 결과 |
|---|---|
| 일기를 쓴다 | 칸 아래에 "남은 글자 1,234자"를 보여 준다 |
| 2,000자가 된다 | 더 입력되지 않는다. "남은 글자 0자"로 보여 준다 |
| 2,000자가 넘는 글을 붙여 넣는다 | 2,000자까지만 들어가고, 칸 아래에 "2,000자까지만 쓸 수 있어요."를 보여 준다. 자를 때 이모지를 반으로 쪼개지 않는다 (`cutToMaxChars`) |

| 글자 | 문구 |
|---|---|
| 칸 이름 | 여행일기 |
| 비어 있을 때 칸 안 안내 | 이 여행에서 있었던 일을 적어 보세요. |
| 남은 글자 수 | 남은 글자 1,234자 (천 단위에 쉼표) |
| 붙여 넣은 글이 잘렸을 때 | 2,000자까지만 쓸 수 있어요. |

- 넣은 글이 잘렸는지로 안내를 정한다. 붙여 넣기든 2,000자에서 한 글자 더 치기든 잘렸으면 "2,000자까지만 쓸 수 있어요."를 보여 주고, 다음 입력이 잘리지 않으면 안내를 지운다
- 안내 글자는 `maxLength`로 만든다 (2000 → "2,000자까지만 쓸 수 있어요.")
- **일기 남은 글자 수는 DiaryField가 맡는다**
- 글자는 `src/lib`의 `countDiaryChars`(4장)로 센다. 화면의 Zod 규칙과 같은 함수다. 백엔드는 파이썬 `count_diary_chars`로 세고, 같은 테스트 값(TEST_CASES BE-01~04)으로 결과를 맞춘다 (API_SPEC 5장)
- 브라우저 입력 칸의 기본 글자 제한(`maxLength`)은 이모지를 2자로 세므로 쓰지 않는다

### 3-9. DongPicker — F-11 (v0.4)

```ts
interface DongOption {
  code: DongCode;
  name: string; // 예: "군위읍"
}

interface DongPickerProps {
  options: DongOption[];        // 그 지역의 동네 (코드 목록 파일)
  selected: DongCode[];
  error?: string;
  onChange: (selected: DongCode[]) => void;
}
```

| 사용자 동작 | 결과 |
|---|---|
| 동네를 누른다 | 고른 목록에 넣는다. 이미 골랐으면 뺀다 (같은 동네를 두 번 넣을 수 없다) |
| 아무것도 안 고른다 | 괜찮다. 빈 목록으로 저장된다 |

| 글자 | 문구 |
|---|---|
| 칸 이름 | 다녀온 동네 |
| 칸 아래 안내 | 여러 곳을 고를 수 있어요. |

- `src/components/DongPicker.tsx`에서 내보낸다. `DongOption` 타입은 `src/types/region.ts`에 둔다
- `<fieldset>`(이름은 `<legend>` "다녀온 동네") 안에 동네마다 체크 상자(`<input type="checkbox">`)를 하나씩 둔다. 체크 상자의 이름은 동네 이름이다
- 고른 순서대로 `selected` 뒤에 붙이고, 뺄 때는 그 동네만 뺀다
- 동네 목록은 `getDongOptions(지역 코드)`(4장)의 순서(코드 목록 파일 순서) 그대로 보여 준다

### 3-10. FormError — F-03, F-05

```ts
interface FormErrorProps {
  message?: string; // 없으면 아무것도 안 보여 준다
}
```

- 특정 칸에 붙일 수 없는 에러(`INVALID_REQUEST`, `INVALID_REGION_CODE`, `INTERNAL_ERROR`, 인터넷 연결 문제)를 폼 위쪽에 보여 준다

### 3-11. TripDetail — F-04

```ts
interface TripDetailProps {
  trip: TripWithNumber;
  dongNames: string[]; // v0.3까지는 []
}
```

- 번호는 화면 제목(PageHeader)에 보여 주고, 본문에는 날짜, 다녀온 동네(v0.4), 여행일기를 보여 준다
- 날짜 글자는 목록과 같이 `formatTripDates()`로 만든다
- 여행 상세 화면은 `getDongNames(여행의 dongCodes)`(4장)로 `dongNames`를 만든다. 동네 이름은 `<ul>` 목록으로 보여 준다 (v0.4)

| 글자 | 문구 |
|---|---|
| 동네 제목 (v0.4) | 다녀온 동네 |
| 동네를 안 골랐을 때 (v0.4) | 고른 동네가 없어요. |
| 일기 제목 | 여행일기 |
| 일기가 비어 있을 때 | 작성한 여행일기가 없어요. |
| 수정 버튼 | 수정 |
| 삭제 버튼 | 삭제 |

### 3-11-1. 여행 상세 화면 (TripDetailPage, `app/regions/[regionCode]/trips/[tripId]/page.tsx`) — F-04, F-06

- 브라우저에서 도는 화면이다. 주소의 지역 코드와 여행 id는 `useParams()`로 읽는다
- 여행은 `useTripStore().listTrips(지역 코드)` → `assignTripNumbers()`로 번호를 매긴 뒤 id로 찾는다 (번호를 매기려면 그 지역의 목록이 필요하다, API_SPEC 1장)
- 찾지 못하면 6장의 "여행을 찾을 수 없어요…" 문구와 "지역 화면으로" 버튼(`StatusMessage`)을 보여 주고, 누르면 지역 화면으로 이동한다
- "수정"은 `/regions/[지역 코드]/trips/[여행 id]/edit`로 가는 링크다
- 삭제: `deleteTrip(여행 id)`가 끝나면 지역 화면으로 이동한다

### 3-12. DeleteTripButton, ConfirmDialog — F-06

```ts
interface DeleteTripButtonProps {
  onDelete: () => Promise<void>;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;          // "정말 지울까요?"
  message: string;        // "삭제한 여행은 되돌릴 수 없어요."
  confirmLabel: string;   // "삭제"
  cancelLabel: string;    // "취소"
  onConfirm: () => void;
  onCancel: () => void;
}
```

| 사용자 동작 | 결과 |
|---|---|
| 삭제 버튼을 누른다 | 바로 지우지 않고 ConfirmDialog를 연다 |
| 확인 창에서 "삭제"를 누른다 | `onDelete`를 부른다. 성공하면 지역 화면으로 이동하고, 남은 여행의 번호가 다시 매겨져 보인다 (F-07) |
| 확인 창에서 "취소"를 누른다 | 창을 닫고 아무것도 지우지 않는다 |

- **삭제 확인은 DeleteTripButton이 ConfirmDialog를 열어서 맡는다.** API는 확인 없이 바로 지우기 때문이다 (API_SPEC 3-4)
- ConfirmDialog는 `role="dialog"`, `aria-modal="true"`인 상자이고, 화면 읽기용 이름은 `title`이다. `open`이 false면 아무것도 그리지 않는다
- 삭제 중에는 DeleteTripButton이 `confirmLabel`을 "삭제 중…"으로 바꾸고, 그동안 확인 창의 "삭제"를 다시 눌러도 `onDelete`를 또 부르지 않는다
- `onDelete`가 끝나면(성공·실패 모두) 확인 창을 닫는다. 삭제 실패 안내와 "다시 시도"는 여행 상세 화면이 보여 준다 (6장, v0.2~)
- `src/components/DeleteTripButton.tsx`, `src/components/ConfirmDialog.tsx`에서 각각 내보낸다

### 3-13. StatusMessage — 모든 화면

```ts
interface StatusMessageProps {
  kind: "loading" | "empty" | "error";
  message: string;
  actionLabel?: string;   // 예: "다시 시도", "새 여행 기록"
  onAction?: () => void;
}
```

- 로딩·빈 목록·에러 문구를 한 모양으로 보여 준다. 문구는 6장을 따른다

### 3-14. AttributionFooter — 지도 데이터 출처

```ts
// Props 없음
```

- **모든 화면 맨 아래에 한 줄로 보여 준다.** 문구: "지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)"
- "admdongkor"는 admdongkor 데이터 페이지(https://github.com/vuski/admdongkor)로 가는 링크다. 새 탭에서 연다
- 가장 바깥 레이아웃(`RootLayout`)에 한 번만 넣는다

**이 위치로 정한 이유**
- 지도 화면뿐 아니라 동네 선택(v0.4), 지역 이름에도 같은 데이터를 쓰므로 모든 화면에 보이는 것이 맞다
- 레이아웃에 한 번만 넣으면 화면을 새로 만들어도 빠뜨리지 않는다
- 지도 위에 겹쳐 두면 확대·이동할 때 지역을 가릴 수 있어서, 지도 바깥 맨 아래에 둔다

## 4. 계산 함수 (src/lib)

화면 부품이 아니라 `src/lib/`의 순수 함수로 둔다. 순수 함수는 같은 값을 넣으면 항상 같은 결과가 나오고, 화면이나 저장소를 건드리지 않는다. 그래서 테스트하기 쉽다 (CLAUDE.md).

```ts
// 방문 횟수: 지역별 여행 개수
function countVisits(trips: Trip[]): Record<RegionCode, number>;

// 색칠 단계: 0번 "none"(흰색), 1번 "once"(연두색), 2번 이상 "many"(진한 초록, v0.4부터 지형 무늬)
type ColorStage = "none" | "once" | "many";
function getColorStage(visitCount: number): ColorStage;

// 여행 번호: 한 지역의 여행에 시작일 → 기록한 시각 순으로 1, 2, 3… 을 붙인다
function assignTripNumbers(trips: Trip[]): TripWithNumber[];

// 목록 정렬: 최신순. 시작일이 늦은 것이 위, 시작일이 같으면 나중에 기록한 것이 위
function sortTripsNewestFirst(trips: TripWithNumber[]): TripWithNumber[];

// 지도 완성도: 가 본 시·군·구 넓이 ÷ 전체 땅 넓이 × 100 (v0.4)
// 모든 지역을 가 봤으면 나눗셈 없이 정확히 100을 돌려준다 (소수 계산 오차로 99.99…가 되지 않게)
function calcCompletion(
  visitedRegionCodes: RegionCode[],
  regionAreas: Record<RegionCode, number>, // 지도 데이터에 미리 넣어 둔 넓이 (TRD 6장)
): number;

// 지형 (v0.4, src/lib/terrain.ts). 모두 무작위 값 없이 경도·위도만으로 정해진다
// 높이 0(평지) ~ 1(가장 높은 산)
function terrainHeight(lon: number, lat: number): number;
// 그 자리의 위성사진 같은 색 [r, g, b] (0~255). 높이별 색에 그림자를 더한다
function terrainColor(lon: number, lat: number): [number, number, number];
// width×height 그림의 RGBA 값. 점마다 toLonLat로 경도·위도를 구해 terrainColor로 칠한다. null이면 투명
function paintTerrain(
  width: number,
  height: number,
  toLonLat: (x: number, y: number) => [number, number] | null,
): Uint8ClampedArray;

// 글자 세기: 문자 하나를 1자로 센다 (이모지 😀도 1자). 화면(DiaryField)과 화면의 Zod 규칙이 같이 쓴다. 백엔드는 파이썬 짝 함수를 따로 둔다
function countDiaryChars(text: string): number;

// 글자 자르기: countDiaryChars 기준으로 max자까지만 남긴다. 이모지를 반으로 쪼개지 않는다
function cutToMaxChars(text: string, max: number): string;

// 구 합치기: 일반 시의 구 코드 → 합친 시 코드. 그 밖의 코드는 그대로 (DATA_MODEL 3장)
// 예: "41111" → "41110", "43745"(증평군) → "43745", "11215"(광진구) → "11215"
function toMergedRegionCode(sggCode: string): RegionCode;
```

화면 글자를 만드는 함수도 같은 곳에 둔다.

```ts
// 1 → "첫 번째 여행", 2 → "두 번째 여행" … 10 → "열 번째 여행", 11 → "11번째 여행"
function formatTripNumber(tripNumber: number): string;

// 0 → "0%", 0.04 → "0.1% 미만", 12.39 → "12.3%"(버림), 99.96 → "99.9%", 100 → "100%" (3-3)
function formatPercent(percent: number): string;

// 여행 날짜 글자
// 당일치기 (종료일 null):  "2026.05.03 (당일치기)"
// 같은 해:                 "2026.05.03 ~ 05.04"
// 해를 넘김:               "2025.12.31 ~ 2026.01.01"
// 종료일이 시작일과 같음:  "2026.05.03 (당일치기)"
function formatTripDates(startDate: DateString, endDate: DateString | null): string;

// 여행 기간 (v0.5): 종료일이 없거나 시작일과 같으면 null (날짜 글자에 이미 "당일치기"가 있다). 그 밖에는 "2박 3일"
function formatTripLength(startDate: DateString, endDate: DateString | null): string | null;

// 동네 요약 (v0.5): [] → null, 3곳까지 "가동, 나동, 다동", 4곳 이상 "가동, 나동, 다동 외 2곳"
function formatDongSummary(dongNames: string[]): string | null;

// 폼 값 → 저장할 값. 종료일 "" → null (3-6)
function toTripInput(value: TripFormValue): TripInput;

// 저장된 여행 → 폼 값. 종료일 null → "" (3-6)
function toFormValue(trip: Trip): TripFormValue;

// 지금 한국 시간(Asia/Seoul)의 날짜. 테스트할 수 있게 지금 시각을 넣어 받는다
function getTodayInSeoul(now: Date): DateString;

// 에러 코드 → 화면 문구 (5장 표)
function getErrorMessage(code: string): string;
```

입력 규칙(Zod)도 같은 곳에 둔다. 화면(TripForm, v0.1의 TripStoreProvider)만 쓴다. 백엔드(v0.2~)는 Pydantic과 파이썬 검사 함수로 같은 규칙을 따로 검사하고, TEST_CASES의 VAL 표 하나로 양쪽을 각각 테스트한다.

```ts
// 검사 결과. 검사 순서는 API_SPEC 5장을 따르고, 실패하면 먼저 걸린 에러 하나만 돌려준다
type TripRuleResult<T> =
  | { success: true; data: T }                  // 통과. 빠진 값을 채운 값 (종료일 null, 일기 "", 동네 [])
  | { success: false; code: TripRuleErrorCode }; // 실패. API_SPEC 2장의 에러 코드 중 하나

// 새 여행 규칙
// now: 지금 시각. "오늘"은 getTodayInSeoul(now)로 구한다 (테스트에서 시각을 정해 넣을 수 있게)
// regionCodes: 코드 목록 파일의 시·군·구 코드 (테스트에서는 가짜 코드 목록)
// dongRegions (v0.4): 동네 코드 → 그 동네가 속한 시·군·구 코드. 빼면 빈 목록으로 본다 (동네를 하나라도 보내면 INVALID_DONG_CODE)
function validateNewTrip(
  input: unknown,
  options: { now: Date; regionCodes: ReadonlySet<RegionCode>; dongRegions?: ReadonlyMap<DongCode, RegionCode> },
): TripRuleResult<NewTrip>;

// 수정 규칙. 4개 필드가 모두 있어야 하고, 지역은 받지 않는다 (API_SPEC 3-3)
// dongs (v0.4): 동네를 검사할 때 쓰는 그 여행의 지역 코드와 dongRegions. 빼면 동네를 하나라도 보내면 INVALID_DONG_CODE
function validateTripUpdate(
  input: unknown,
  options: { now: Date; dongs?: { regionCode: RegionCode; dongRegions: ReadonlyMap<DongCode, RegionCode> } },
): TripRuleResult<TripInput>;

// 8단계 동네 검사 순서 (v0.4): 동네마다 숫자 10자리인지, 코드 목록에 있는지, 그 지역의 동네인지 → INVALID_DONG_CODE
// 그다음 같은 동네가 두 번 있는지 → DUPLICATE_DONG_CODE

// 동네 (v0.4, src/lib/dongCodes.ts). 코드 목록 파일(public/data/codes.json)의 dongs를 읽는 유일한 곳
const DONG_REGIONS: ReadonlyMap<DongCode, RegionCode>;               // 동네 코드 → 속한 시·군·구 코드
function getDongOptions(regionCode: RegionCode): DongOption[];        // 그 지역의 동네 (코드 목록 파일 순서)
function getDongNames(dongCodes: DongCode[]): string[];               // 코드 → 이름. 목록에 없는 코드는 뺀다

// "YYYY-MM-DD" 모양이고 실제 있는 날짜인지 (규칙 안에서 쓰고, TripForm이 INVALID_DATE를 칸마다 나눌 때도 쓴다)
function isRealDate(value: string): boolean;
```

| 함수 | 쓰는 곳 | 관련 기능 | 버전 |
|---|---|---|---|
| `countVisits` | HomePage | F-08, F-12 | v0.1 |
| `getColorStage` | MapView | F-08, F-12 | v0.1 |
| `assignTripNumbers` | RegionPage, TripDetailPage | F-07 | v0.1 |
| `sortTripsNewestFirst` | RegionPage | F-02 | v0.1 |
| `calcCompletion` | HomePage | F-13 | v0.4 |
| `DONG_REGIONS`, `getDongOptions`, `getDongNames` | TripForm, useDongOptions, TripDetailPage, TripStoreProvider (v0.1) | F-11 | v0.4 |
| `terrainHeight`, `terrainColor`, `paintTerrain` | MapView (지형 무늬 그림) | F-12 | v0.4 |
| `countDiaryChars` | DiaryField, Zod 규칙 | F-03, F-05 | v0.1 |
| `cutToMaxChars` | DiaryField | F-03, F-05 | v0.1 |
| `toMergedRegionCode` | 지도 파일·코드 목록 파일 만들기 | F-01 | v0.1 |
| `formatTripNumber` | TripListItem, TripDetail | F-02, F-04 | v0.1 |
| `formatPercent` | CompletionBadge | F-13 | v0.4 |
| `formatTripDates` | TripListItem, TripDetail | F-02, F-04 | v0.1 |
| `formatTripLength` | TripListItem, TripDetail | F-17 | v0.5 |
| `formatDongSummary` | TripListItem | F-17 | v0.5 |
| `toTripInput` | TripForm | F-03, F-05 | v0.1 |
| `toFormValue` | EditTripPage | F-05 | v0.1 |
| `getTodayInSeoul` | DateFields, Zod 규칙 | F-03, F-05 | v0.1 |
| `getErrorMessage` | TripForm, FormError, 각 페이지 | F-03, F-05, F-06 | v0.1 |
| `validateNewTrip` | TripForm, TripStoreProvider (v0.1) | F-03 | v0.1 |
| `validateTripUpdate` | TripForm, TripStoreProvider (v0.1) | F-05 | v0.1 |

- 순서 주의: 번호는 **오래된 순**으로 매기고(`assignTripNumbers`), 보여 줄 때는 **최신순**으로 줄 세운다(`sortTripsNewestFirst`). 그래서 목록 맨 위가 가장 큰 번호다

## 5. 에러 코드별 화면 문구

- 화면은 서버가 보낸 `message`가 아니라 **`code`를 보고 아래 문구를 보여 준다** (`getErrorMessage`)
- 이유: v0.1은 서버 없이 화면 안에서 같은 에러 코드를 내므로, 문구를 화면이 정해 두어야 v0.1부터 v1.0까지 같은 문구가 나온다

| 코드 | 화면 문구 | 보여 주는 곳 |
|---|---|---|
| `INVALID_REQUEST` | 요청 형식이 올바르지 않아요. 새로고침한 뒤 다시 시도해 주세요. | 폼 위쪽 (FormError) |
| `START_DATE_REQUIRED` | 시작일을 입력해 주세요. | 시작일 칸 아래 |
| `INVALID_DATE` | 날짜 형식이 올바르지 않아요. | 틀린 칸 아래에 각각 (둘 다 틀리면 두 칸 모두) |
| `START_DATE_IN_FUTURE` | 시작일은 오늘까지만 고를 수 있어요. | 시작일 칸 아래 |
| `END_DATE_BEFORE_START` | 종료일은 시작일보다 빠를 수 없어요. | 종료일 칸 아래 |
| `DIARY_TOO_LONG` | 여행일기는 2,000자까지 쓸 수 있어요. | 일기 칸 아래 |
| `INVALID_REGION_CODE` | 지역을 찾을 수 없어요. 지도에서 다시 골라 주세요. | 폼 위쪽, 또는 지역 화면 전체 (주소가 틀렸을 때) |
| `INVALID_DONG_CODE` | 동네 코드가 올바르지 않아요. 동네를 다시 골라 주세요. | 동네 선택 아래 |
| `DUPLICATE_DONG_CODE` | 같은 동네를 두 번 고를 수 없어요. | 동네 선택 아래 |
| `TRIP_NOT_FOUND` | 여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요. | 상세·수정 화면 전체 + "지역 화면으로" 버튼 |
| `INTERNAL_ERROR` | 잠시 후 다시 시도해 주세요. | 폼 위쪽, 또는 화면 전체 + "다시 시도" 버튼 |
| `NETWORK_ERROR` (서버에 닿지 못함, v0.2~) | 인터넷 연결을 확인하고 다시 시도해 주세요. | 폼 위쪽, 또는 화면 전체 + "다시 시도" 버튼 |
| (모르는 코드) | 문제가 생겼어요. 잠시 후 다시 시도해 주세요. | 폼 위쪽, 또는 화면 전체 |

- `NETWORK_ERROR`와 "모르는 코드"는 API_SPEC의 에러 코드가 아니다. 화면에서만 쓰는 경우다
- 저장(폼)이 서버에서 실패하면 TripForm이 에러를 받아 위 자리에 보여 주고, 다시 저장할 수 있게 버튼을 되살린다 (v0.2~)

## 6. 로딩·빈 목록·에러 문구

| 화면 | 상태 | 문구 | 버튼 |
|---|---|---|---|
| 첫 화면 | 지도 불러오는 중 | 지도를 불러오는 중이에요… | |
| 첫 화면 | 지도 파일을 못 불러옴 | 지도를 불러오지 못했어요. | 다시 시도 |
| 첫 화면 | 여행 기록을 못 불러옴 | 여행 기록을 불러오지 못했어요. 지도는 빈 상태로 보여요. | 다시 시도 |
| 첫 화면 | 여행이 하나도 없음 | 다녀온 지역을 눌러 첫 여행을 기록해 보세요. | |
| 지역 화면 | 불러오는 중 | 여행 목록을 불러오는 중이에요… | |
| 지역 화면 | 여행이 없음 | 아직 이 지역의 여행 기록이 없어요. | 새 여행 기록 |
| 지역 화면 | 못 불러옴 | 여행 목록을 불러오지 못했어요. | 다시 시도 |
| 지역 화면 | 주소의 지역 코드가 없음 | 지역을 찾을 수 없어요. 지도에서 다시 골라 주세요. | 지도로 가기 |
| 새 여행 기록·수정 | 저장 중 | (저장 버튼이) 저장 중… | |
| 새 여행 기록·수정 | 동네 목록 불러오는 중 (v0.4) | 동네 목록을 불러오는 중이에요… | |
| 새 여행 기록·수정 | 동네 목록을 못 불러옴 (v0.4) | 동네 목록을 불러오지 못했어요. | 다시 시도 |
| 여행 상세·수정 | 불러오는 중 | 여행을 불러오는 중이에요… | |
| 여행 상세·수정 | 여행이 없음 (v0.1에서 새로고침한 경우도 포함, 정상) | 여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요. | 지역 화면으로 |
| 여행 상세 | 일기가 비어 있음 | 작성한 여행일기가 없어요. | |
| 여행 상세 | 삭제 중 | (확인 창의 삭제 버튼이) 삭제 중… | |
| 여행 상세 | 삭제 실패 | 5장 문구 | 다시 시도 |

### 그 밖의 화면 글자

| 곳 | 문구 |
|---|---|
| 브라우저 탭 제목 | 나만의 여행 지도 |
| 지도의 각 지역 (화면 읽기 프로그램용 이름) | 지역 이름 (예: "대구광역시 군위군") |
| 지역 화면의 새 여행 버튼 | 새 여행 기록 |
| 다른 화면으로 가는 버튼 | 지도로 가기 / 지역 화면으로 / 다시 시도 |

## 7. 맡는 부품 정리

| 할 일 | 맡는 부품 | 관련 기능 |
|---|---|---|
| 지도 확대·이동 | MapView (확대 상태 기억은 MapViewportProvider) | F-16 |
| 삭제 확인 | DeleteTripButton + ConfirmDialog | F-06 |
| 일기 남은 글자 수, 2,000자에서 입력 막기 | DiaryField | F-03, F-05 |
| 미래 시작일 막기 | DateFields (달력) + Zod 규칙 (서버에서는 백엔드 검사) | F-03, F-05 |
| 지도 데이터 출처 표시 | AttributionFooter | (라이선스) |

## 8. 기능 ID별 부품

| 기능 | 부품·함수 | 버전 |
|---|---|---|
| F-01 전국 지도 보기 | HomePage, MapView | v0.1 |
| F-02 지역 여행 목록 | RegionPage, PageHeader, TripList, TripListItem, `sortTripsNewestFirst`, `formatTripNumber` | v0.1 |
| F-03 여행 추가 | NewTripPage, TripForm, DateFields, DiaryField, FormError | v0.1 |
| F-04 여행 상세 | TripDetailPage, TripDetail | v0.1 |
| F-05 여행 수정 | EditTripPage, TripForm (재사용) | v0.1 |
| F-06 여행 삭제 | DeleteTripButton, ConfirmDialog | v0.1 |
| F-07 여행 번호 매기기 | `assignTripNumbers` | v0.1 |
| F-08 지도 색칠 | MapView, `countVisits`, `getColorStage` | v0.1 |
| F-09 서버에 기록 저장 | TripStoreProvider (API 부르기로 바꿈) | v0.2 |
| F-10 기록 유지 | (화면 변화 없음. 서버가 DB에 저장) | v0.3 |
| F-11 동네 선택 | DongPicker, TripDetail의 동네 표시 | v0.4 |
| F-12 지형 무늬 색칠 | MapView (`"many"` 단계를 무늬로 그림) | v0.4 |
| F-13 지도 완성도 | CompletionBadge, `calcCompletion`, `formatPercent` | v0.4 |
| F-14 배포 | (부품 없음) | v1.0 |
| F-15 휴대폰 홈 화면 설치 | (부품 없음. 앱 설치 설정 파일로 처리) | v1.0 |
| F-16 지도 확대·이동 | MapView, MapViewportProvider | v0.1 |
| F-17 화면 디자인 | 모든 페이지와 부품, `app/globals.css`, `formatTripLength`, `formatDongSummary` (10장) | v0.5 |

## 9. 정한 것

- 지역 이름: 코드 목록 파일에 함께 넣는다. TRD 6장을 "코드와 이름"으로 맞췄다 (3-4)
- 여행 번호 표기: "열 번째 여행"까지는 한글, 11번째부터는 "11번째 여행"으로 쓴다 (4장 `formatTripNumber`)
- 지도 확대 상태: 첫 화면으로 돌아오면 그대로 두고, 새로고침하면 처음으로 돌아간다 (3-2, 3-2-1)

## 10. 화면 디자인 (v0.5) — F-17

> 기준: `docs/design/여행 지도 앱 디자인 시안.pdf`(시안), `docs/design/나의 여행 지도.html`(맛보기). 둘이 다르면 IDEA.md 규칙에 맞는 쪽을 따른다.

### 10-1. 빼는 것

| 시안에 있는 것 | 빼는 이유 |
|---|---|
| 사진 (사진 수, 미리보기, 사진 칸, 대표 사진, 크게 보기) | v1.2 |
| "색으로/사진으로" 전환 | 사진 기능이 있어야 쓸모가 있다 |
| 검색 (돋보기, 지역 이름으로 찾기) | IDEA "지금은 빼는 것" |
| 첫 화면 아래 지역 미리보기 창 ("기록 보기") | 지역을 누르면 바로 지역 화면으로 가는 지금 동작(F-02)이 바뀐다 |
| 떠 있는 + 버튼 | 어느 지역에 기록할지 고르는 새 흐름이 필요하다 |
| 지역 화면의 동네 지도, 날짜별 보기 (전체/2026.03) | 명세에 없는 새 기능 |
| 동네를 지도에서 고르기, "+18곳 더" 접기 | 동네는 칩 목록으로만 고르고, 모두 보여 준다 |
| 확대 버튼(+/−/전국), 마우스를 올리면 뜨는 지역 이름 | 확대는 손가락과 휠로 이미 된다 (F-16) |
| 예시 기록, "이 브라우저에만 저장" 안내, 넓은 화면 2단 배치 | 맛보기 버전에서만 쓰는 것 |
| 시안 PDF의 빨강 계열 색칠 | IDEA 색칠 규칙과 다르다. 맛보기의 초록 계열을 쓴다 |
| 시안의 문구 ("기록 저장하기", "–", "나의 여행 지도" 등) | 5·6장의 문구를 그대로 쓴다 (10-7) |
| 여행 상세의 연필 버튼 | 아래쪽 "수정"·"삭제" 버튼을 쓴다 (맛보기 방식. 시안에는 삭제 버튼이 없다) |

### 10-2. 색

밝은 화면 하나만 만든다. 다크 모드는 없다.

`app/globals.css`의 `:root`에 이름을 붙여 두고 Tailwind에서 꺼내 쓴다 (예: `bg-surface`, `text-muted`). `color-scheme: light`로 둔다.

| 이름 | 값 | 쓰는 곳 |
|---|---|---|
| bg | #F3F5F7 | 화면 바탕 |
| surface | #FFFFFF | 카드, 아직 안 간 지역 |
| ink | #18212B | 글자, 기본 버튼 바탕 |
| muted | #5B6672 | 보조 글자 |
| line | #E2E6EA | 테두리, 구분선 |
| sea | #DCE6EE | 지도 바탕(바다) |
| land-edge | #CBD3DA | 시·군·구 경계선 |
| sido-edge | #8E9AA6 | 시·도 경계선 |
| visit-once | #DCE8B8 | 1번 간 지역 (연두색) |
| terrain-base | #6E8B4A | 지형 무늬 그림이 그려지기 전 바탕 |
| accent | #4E7D3A | 고른 칩, 완성도 막대, 포커스 테두리 |
| accent-ink | #3B6A2A | 여행 번호 글자 |
| accent-soft | #E5EFD8 | 상세 화면 동네 칩 바탕 |
| danger | #B42318 | 에러 글자, 삭제 버튼 |

### 10-3. 글꼴과 크기

- 화면 글자는 IBM Plex Sans KR(굵기 400/500/600/700)을 쓴다. 불러오지 못하면 Apple SD Gothic Neo나 Malgun Gothic으로 보인다
- 여행일기(입력 칸과 상세)는 고운바탕(Gowun Batang)을 쓴다. 일기장 느낌을 내기 위해서다 (Tailwind `font-diary`)
- 둘 다 `next/font/google`로 불러온다 (TRD 2장)

| 곳 | 크기 | 굵기 |
|---|---|---|
| 첫 화면 제목 | 28px | 굵게 |
| 화면 제목 (PageHeader) | 22px | 굵게 |
| 카드 제목 | 16px | 굵게 |
| 여행 날짜 | 목록 18px, 상세 26px | 굵게, 숫자 폭 고정 |
| 본문 | 15px | 보통 |
| 보조 글자 | 13px | 보통 |
| 여행일기 | 입력 16px(줄 간격 1.7), 상세 17px(줄 간격 1.8) | 보통 |

### 10-4. 공통 모양

- 본문 폭은 최대 640px이고 가운데에 둔다. 양옆 여백은 16px이다
- 안전 영역: `viewport-fit=cover`로 화면 끝까지 쓰고, 위·아래·양옆에 `env(safe-area-inset-*)`만큼 여백을 더한다
- 카드: 흰 바탕, 그림자 없음. 큰 카드는 모서리 24px·안쪽 여백 20px, 여행 카드는 모서리 18px·안쪽 여백 16px
- 누르는 곳은 모두 44px 이상이다
- 버튼은 세 가지다 (`globals.css`의 `btn-primary`, `btn-secondary`, `btn-danger`)

| 종류 | 모양 | 쓰는 곳 |
|---|---|---|
| 기본 | ink 바탕, 흰 글자, 높이 52px, 모서리 16px | 저장 |
| 보조 | 투명 바탕, line 테두리 | 취소, 수정, 다시 시도 |
| 위험 | 투명 바탕, danger 글자, line 테두리 | 삭제 |

- 칩: 높이 40px, 모서리를 끝까지 둥글게. 고르면 accent 바탕에 흰 글자와 ✓
- 입력 칸: 높이 48px, 모서리 12px, line 테두리
- 키보드로 옮겨 간 곳에는 accent 색 2px 테두리를 보여 준다
- 기기에서 "동작 줄이기"를 켜 두었으면 움직임 효과를 끈다

### 10-5. 화면별 배치

**첫 화면** (위에서부터)
1. 제목 "나만의 여행 지도" (`<h1>`)
2. 숫자 카드: 첫 줄에 "다녀온 시·군·구 `6 / 전체 수`"와 "여행 `9번`"을 나란히, 둘째 줄에 지도 완성도 카드(3-3)를 가로로 꽉 차게 막대와 함께 둔다. 여행 목록을 다 불러온 뒤에만 보여 준다 (3-3과 같은 이유)
   - 다녀온 시·군·구 = `countVisits()` 결과의 지역 수, 전체 수 = `REGION_CODES`의 개수
   - 여행 = 여행 목록의 개수
3. 지도 카드: 바다색 둥근 상자(가로:세로 = 3:4). 왼쪽 아래에 범례 "아직 / 1번 / 2번 이상"을 둔다. "2번 이상" 견본은 지형 무늬 그림으로 보여 준다. 불러오는 중 문구는 상자 가운데에 보여 준다
4. 안내·에러 문구, 그 아래 출처

**지역 화면**
1. PageHeader (부제 "여행 3번")
2. 섹션 줄: 왼쪽에 "여행 기록"과 작은 글씨 "최신순", 오른쪽에 "+ 새 여행 기록" 링크 (accent 글자, + 그림은 `aria-hidden`. 링크 이름은 "새 여행 기록" 그대로)
3. 여행 카드 목록. 여행이 없으면 점선 상자 안에 "아직 이 지역의 여행 기록이 없어요."

**여행 카드 (TripListItem)**
- 첫 줄: "두 번째 여행"(13px, accent-ink), 오른쪽에 › 그림
- 둘째 줄: "2026.03.03 ~ 03.05"(18px, 굵게)
- 셋째 줄: "2박 3일 · 황남동, 보덕동"(13px, muted). `formatTripLength`와 `formatDongSummary`로 만든다. 둘 중 없는 것은 빼고, 둘 다 없으면 셋째 줄이 없다
- 카드 전체가 링크다

**새 여행 기록 · 여행 수정**
1. PageHeader (부제는 3-4 표)
2. 폼 위쪽 에러(FormError): 빨간 테두리 상자
3. 카드 "언제 다녀왔어요?": 시작일·종료일 두 칸을 나란히 둔다 (360px에서도 나란히). 종료일 안내는 그 아래
4. 카드 "다녀온 동네" (legend가 카드 제목): 동네 칩. 체크 상자는 그대로 두고 모양만 칩으로 바꾼다. 안내 "여러 곳을 고를 수 있어요."는 제목 오른쪽에 작게
5. 카드 "여행일기": 고운바탕, 최소 높이 160px. 남은 글자 수는 오른쪽 아래
6. 맨 아래에 "저장"(기본, 가로 꽉), 그 아래 "취소"(보조, 가로 꽉). 화면에 고정하지 않는다 (휴대폰 키보드가 올라와도 가리지 않게)

**여행 상세**
1. PageHeader (제목 "두 번째 여행", 부제 지역 이름)
2. 흰 카드 하나 안에: 날짜(26px, 굵게) → 기간 "2박 3일"(muted, `formatTripLength`. 없으면 뺀다) → "다녀온 동네" 칩(accent-soft 바탕, 핀 그림) → 구분선 → "여행일기" 작은 제목 → 일기(고운바탕, 줄바꿈 그대로, 접지 않음)
3. 아래에 "수정"(보조), "삭제"(위험) 버튼을 나란히
4. ConfirmDialog: 뒤 화면을 어둡게(검정 40%) 하고, 휴대폰에서는 아래에서 올라오는 흰 카드(위 모서리 24px), 넓은 화면에서는 가운데 카드로 보여 준다. 버튼은 "취소"(보조), "삭제"(위험)

**공통 부품**
- StatusMessage: 불러오는 중은 muted 글자로 가운데, 빈 목록은 점선 상자, 에러는 흰 카드 + danger 글자 + 보조 버튼
- AttributionFooter: 12px muted 글자로 가운데, 맨 아래 안전 영역 위

### 10-6. 지도 그리기에서 바뀌는 것

- 색: 0번은 surface, 1번은 visit-once, 2번 이상은 지형 무늬 (바탕 terrain-base)
- 시·군·구 경계선(land-edge, 0.6px) 위에 시·도 경계선(sido-edge, 1px)을 한 겹 더 그린다. 지역 코드 앞 두 자리가 다른 이웃 사이에만 그린다 (topojson `mesh`). 이 선은 눌리지 않는다 (`pointer-events: none`)
- 키보드로 고른 지역은 ink 색 2px 테두리
- `aria-label`, `data-color-stage`, `role`, `tabIndex`는 그대로다

### 10-7. 바뀌지 않는 것

- 5·6장의 모든 문구, 버튼 이름, 화면 읽기용 이름. 예외는 "‹ 뒤로" 글자가 그림으로 바뀌는 것 하나다 (3-4, TEST_CASES UI-30)
- 주소, 동작, 계산 결과
