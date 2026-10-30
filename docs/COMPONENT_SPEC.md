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
| v0.1 | 브라우저 메모리에 저장한다. 입력 검사도 같은 Zod 규칙으로 하고, 실패하면 API_SPEC과 같은 에러 코드를 낸다 |
| v0.2 ~ | API_SPEC의 4개 주소를 부른다 |

- 버전이 바뀌어도 `TripStore`의 모양과 에러 코드는 같다. 그래서 v0.2에서 저장 위치를 바꿔도 페이지와 부품은 고치지 않는다 (TRD 3장)

### 3-2. MapView — F-01, F-08, F-12, F-16

```ts
interface MapViewProps {
  regions: RegionFeature[];                       // 시·군·구 모양 (public/data/)
  visitCounts: Record<RegionCode, number>;        // countVisits()의 결과
  onRegionClick: (regionCode: RegionCode) => void;
  viewport: MapViewport | null;                   // 기억해 둔 확대 상태·위치. null이면 전국이 보이게
  onViewportChange: (viewport: MapViewport) => void;
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

### 3-4. PageHeader — F-02, F-03, F-04, F-05

```ts
interface PageHeaderProps {
  title: string;     // 아래 표
  backHref: string;  // 뒤로 가기 버튼이 갈 주소
}
```

| 화면 | 제목 (`title`) | 뒤로 가기가 갈 곳 |
|---|---|---|
| 지역 화면 | 지역 이름 (예: "대구광역시 군위군") | 첫 화면 |
| 새 여행 기록 | "새 여행 기록" | 지역 화면 |
| 여행 상세 | 여행 번호 (예: "두 번째 여행") | 지역 화면 |
| 여행 수정 | "여행 수정" | 여행 상세 |

- 뒤로 가기 버튼은 "‹ 뒤로"로 보여 주고, 화면 읽기 프로그램용 이름은 "뒤로 가기"로 한다
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
}
```

| 사용자 동작 | 결과 |
|---|---|
| 목록을 본다 | 최신순으로 첫 줄에 번호("세 번째 여행"), 둘째 줄에 날짜("2026.05.03 ~ 05.04")를 보여 준다. 날짜 글자는 `formatTripDates()`로 만든다 (4장) |
| 여행 하나를 누른다 | 여행 상세로 이동한다 |
| "새 여행 기록" 버튼을 누른다 | 새 여행 기록 화면으로 이동한다 |

- 번호 글자는 `formatTripNumber()`로 만든다
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
  dongOptions?: DongOption[];                   // v0.4부터
  onSubmit: (input: TripInput) => Promise<void>;  // 바꾼 뒤의 값 (아래)
  onCancel: () => void;
}

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

### 3-6-1. 새 여행 기록 화면 (NewTripPage, `app/regions/[regionCode]/trips/new/page.tsx`) — F-03

- 브라우저에서 도는 화면이다. 주소의 지역 코드는 `useParams()`로 읽는다
- 저장: `useTripStore().createTrip({ regionCode, ...input })`가 끝나면 지역 화면(`/regions/[지역 코드]`)으로 이동한다
- 취소: 지역 화면으로 이동한다 (뒤로 가기 버튼과 같은 곳. 주소로 바로 들어온 경우에도 앱 밖으로 나가지 않게 `router.back()` 대신 주소로 간다)

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
- 글자는 `src/lib`의 `countDiaryChars`(4장)로 센다. 서버 검사와 같은 함수라서 화면과 서버의 글자 수가 항상 같다 (API_SPEC 5장)
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

// 글자 세기: 문자 하나를 1자로 센다 (이모지 😀도 1자). 화면(DiaryField)과 서버(Zod 규칙)가 같이 쓴다
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

// 폼 값 → 저장할 값. 종료일 "" → null (3-6)
function toTripInput(value: TripFormValue): TripInput;

// 저장된 여행 → 폼 값. 종료일 null → "" (3-6)
function toFormValue(trip: Trip): TripFormValue;

// 지금 한국 시간(Asia/Seoul)의 날짜. 테스트할 수 있게 지금 시각을 넣어 받는다
function getTodayInSeoul(now: Date): DateString;

// 에러 코드 → 화면 문구 (5장 표)
function getErrorMessage(code: string): string;
```

입력 규칙(Zod)도 같은 곳에 둔다. 화면과 서버(v0.2~)가 같이 쓴다.

```ts
// 검사 결과. 검사 순서는 API_SPEC 5장을 따르고, 실패하면 먼저 걸린 에러 하나만 돌려준다
type TripRuleResult<T> =
  | { success: true; data: T }                  // 통과. 빠진 값을 채운 값 (종료일 null, 일기 "", 동네 [])
  | { success: false; code: TripRuleErrorCode }; // 실패. API_SPEC 2장의 에러 코드 중 하나

// 새 여행 규칙
// now: 지금 시각. "오늘"은 getTodayInSeoul(now)로 구한다 (테스트에서 시각을 정해 넣을 수 있게)
// regionCodes: 코드 목록 파일의 시·군·구 코드 (테스트에서는 가짜 코드 목록)
function validateNewTrip(
  input: unknown,
  options: { now: Date; regionCodes: ReadonlySet<RegionCode> },
): TripRuleResult<NewTrip>;

// 수정 규칙. 4개 필드가 모두 있어야 하고, 지역은 받지 않는다 (API_SPEC 3-3)
function validateTripUpdate(input: unknown, options: { now: Date }): TripRuleResult<TripInput>;

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
| `countDiaryChars` | DiaryField, Zod 규칙 (화면·서버) | F-03, F-05 | v0.1 |
| `cutToMaxChars` | DiaryField | F-03, F-05 | v0.1 |
| `toMergedRegionCode` | 지도 파일·코드 목록 파일 만들기 | F-01 | v0.1 |
| `formatTripNumber` | TripListItem, TripDetail | F-02, F-04 | v0.1 |
| `formatPercent` | CompletionBadge | F-13 | v0.4 |
| `formatTripDates` | TripListItem, TripDetail | F-02, F-04 | v0.1 |
| `toTripInput` | TripForm | F-03, F-05 | v0.1 |
| `toFormValue` | EditTripPage | F-05 | v0.1 |
| `getTodayInSeoul` | DateFields, Zod 규칙 | F-03, F-05 | v0.1 |
| `getErrorMessage` | TripForm, FormError, 각 페이지 | F-03, F-05, F-06 | v0.1 |
| `validateNewTrip` | TripForm, TripStoreProvider (v0.1), POST API (v0.2~) | F-03 | v0.1 |
| `validateTripUpdate` | TripForm, TripStoreProvider (v0.1), PUT API (v0.2~) | F-05 | v0.1 |

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
| (서버에 닿지 못함, v0.2~) | 인터넷 연결을 확인하고 다시 시도해 주세요. | 폼 위쪽, 또는 화면 전체 + "다시 시도" 버튼 |
| (모르는 코드) | 문제가 생겼어요. 잠시 후 다시 시도해 주세요. | 폼 위쪽, 또는 화면 전체 |

- "서버에 닿지 못함"과 "모르는 코드"는 API_SPEC의 에러 코드가 아니다. 화면에서만 쓰는 경우다

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
| 미래 시작일 막기 | DateFields (달력) + Zod 규칙 | F-03, F-05 |
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

## 9. 정한 것

- 지역 이름: 코드 목록 파일에 함께 넣는다. TRD 6장을 "코드와 이름"으로 맞췄다 (3-4)
- 여행 번호 표기: "열 번째 여행"까지는 한글, 11번째부터는 "11번째 여행"으로 쓴다 (4장 `formatTripNumber`)
- 지도 확대 상태: 첫 화면으로 돌아오면 그대로 두고, 새로고침하면 처음으로 돌아간다 (3-2, 3-2-1)
