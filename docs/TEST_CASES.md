# TEST_CASES - 나만의 여행 지도 (초안)

> 기준 문서: [IDEA.md](IDEA.md), [PRD.md](PRD.md), [TRD.md](TRD.md), [DATA_MODEL.md](DATA_MODEL.md), [API_SPEC.md](API_SPEC.md), [COMPONENT_SPEC.md](COMPONENT_SPEC.md). 이 문서와 IDEA.md가 다르면 IDEA.md를 따른다.
> 범위: v0.1 ~ v1.0. 기능 ID(F-01 등)는 PRD.md를 따른다.

## 1. 테스트 나누기

| 묶음 | 무엇을 | 도구 | 처음 쓰는 버전 |
|---|---|---|---|
| LOGIC | `src/lib`의 계산 함수 (COMPONENT_SPEC 4장) | Jest | v0.1 |
| VAL | 입력 검사. 화면(Zod)과 백엔드(파이썬)가 같은 규칙을 쓴다 | 화면: Jest / 백엔드: pytest | 화면 v0.1, 백엔드 v0.2 |
| BE | 백엔드 함수 (글자 세기, 한국 날짜, TRD 5장) | pytest | v0.2 |
| UI | 컴포넌트와 페이지 (COMPONENT_SPEC 3장) | Jest + React Testing Library | v0.1 |
| API | API 주소 4개 (API_SPEC 3장) | pytest + FastAPI TestClient (서버를 켜지 않고 부른다) | v0.2 |
| MANUAL | 눈으로 확인하는 테스트 (8장) | 사람이 직접 | v0.1 |

- "버전" 칸은 그 테스트를 **처음 쓰는 버전**이다. 한 번 만든 테스트는 이후 버전에서도 계속 통과해야 한다
- 프런트 테스트는 `npm test`, 백엔드 테스트는 `backend/`에서 `uv run python -m pytest`로 돌린다 (CLAUDE.md)
- 예외: 상황에 "v0.3까지"라고 적힌 테스트(VAL-42, API-21)는 v0.4에서 동네 선택이 생기면서 규칙이 바뀐다. 이때는 지우지 않고, v0.4 테스트(VAL-43~47, API-22~23)와 함께 "동네 코드 파일이 없을 때"의 테스트로 바꿔 남긴다
- 예외: v0.2의 `test_get_repo_returns_same_memory_repository`(`backend/tests/test_api_base.py`, "`get_repo`는 늘 같은 메모리 저장소를 준다")는 v0.3에서 저장 위치가 DB로 바뀌면서 규칙이 바뀌었다. 지우지 않고 `test_get_repo_opens_and_closes_sql_session`("`get_repo`는 요청마다 DB 세션을 열어 SQL 저장소를 주고, 응답이 끝나면 세션을 닫는다", 테스트용 DB, `-m db`)으로 바꿔 남긴다
- DB 테스트(`@pytest.mark.db`)는 기본 `uv run python -m pytest`에서 빠지고, `uv run python -m pytest -m db`로 따로 돌린다 (v0.3)
- 테스트를 삭제하거나 건너뛰지 않는다. 실패하면 테스트가 아니라 구현을 고친다 (CLAUDE.md)

## 2. 테스트 데이터

실제 개인 기록은 넣지 않는다. 모든 데이터는 연습용 가짜 값이다 (CLAUDE.md).

### 가짜 지도 데이터 (사각형 2개)
진짜 지도 파일 대신 아래 데이터를 쓴다. 지도 파일이 커도 테스트가 느려지지 않고, 넓이 계산 결과를 손으로 셈할 수 있다.

| 지역 | 코드 | 이름 | 모양 | 넓이 | 동네 (코드, 이름) |
|---|---|---|---|---|---|
| A | `99010` | 테스트시 가구 | 사각형 (0,0)~(1,1) | 1 | `9901010100` 가동, `9901010200` 나동 |
| B | `99020` | 테스트시 나구 | 사각형 (1,0)~(4,1) | 3 | `9902010100` 다동 |

- 전체 땅 넓이 = 1 + 3 = 4. A만 가 보면 완성도 25%, 둘 다 가 보면 100%
- 코드 목록 파일(TRD 6장)도 같은 내용으로 가짜를 만든다
  - 화면: `tests/fixtures/codes.ts`
  - 백엔드: `backend/tests/`에 같은 내용의 가짜 코드 목록을 두고, 진짜 `codes.json` 대신 넣는다 (의존성 주입, TRD 8장)
- 형식은 맞지만 없는 지역 코드: `99999`. 없는 동네 코드: `9999999999`

### 기준 시각
- "오늘"이 필요한 테스트는 지금 시각을 직접 넣는다 (화면: `getTodayInSeoul(now)`, 백엔드: `today_in_seoul(now)`, API 테스트는 "지금 시각" 의존성을 바꿔 끼운다)
- 따로 적지 않으면 기준 시각은 `2026-10-29T03:00:00Z` (한국 시간 2026-10-29 12:00), 오늘 = `2026-10-29`

### 가짜 여행
| 이름 | 지역 | 시작일 | 종료일 | 기록한 시각 (`createdAt`) |
|---|---|---|---|---|
| T1 | A | 2026-05-01 | 2026-05-02 | 2026-05-03T00:00:00Z |
| T2 | A | 2026-06-01 | null | 2026-06-02T00:00:00Z |
| T3 | A | 2026-07-01 | 2026-07-03 | 2026-07-04T00:00:00Z |
| S1 | A | 2026-08-15 | null | 2026-08-16T09:00:00Z |
| S2 | A | 2026-08-15 | null | 2026-08-16T10:00:00Z (S1보다 나중에 기록) |
| B1 | B | 2026-09-01 | null | 2026-09-02T00:00:00Z |

## 3. LOGIC (계산 함수)

### 3-1. 방문 횟수, 색칠 단계

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-01 | `countVisits` | 여행이 없음 | `{}` | F-08 | v0.1 |
| LOGIC-02 | `countVisits` | T1, T2, B1 | `{ "99010": 2, "99020": 1 }` | F-08 | v0.1 |
| LOGIC-03 | `getColorStage` | 0 | `"none"` (흰색) | F-08 | v0.1 |
| LOGIC-04 | `getColorStage` | 1 | `"once"` (연두색) | F-08 | v0.1 |
| LOGIC-05 | `getColorStage` | 2 | `"many"` (진한 초록, v0.4부터 지형 무늬) | F-08, F-12 | v0.1 |
| LOGIC-06 | `getColorStage` | 5 | `"many"` | F-08, F-12 | v0.1 |

### 3-2. 여행 번호

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-10 | `assignTripNumbers` | 여행이 없음 | `[]` | F-07 | v0.1 |
| LOGIC-11 | `assignTripNumbers` | T3, T1, T2를 뒤섞어 넣음 | T1=1, T2=2, T3=3 (시작일 순) | F-07 | v0.1 |
| LOGIC-12 | `assignTripNumbers` | 시작일이 같은 S2, S1을 이 순서로 넣음 | S1=1, S2=2 (먼저 기록한 S1이 앞 번호) | F-07 | v0.1 |
| LOGIC-13 | `assignTripNumbers` | 시작일과 기록한 시각이 다른 순서인 경우: T3의 `createdAt`을 가장 이르게 바꿈 | 그래도 T1=1, T2=2, T3=3 (시작일이 먼저, 기록한 시각은 시작일이 같을 때만) | F-07 | v0.1 |
| LOGIC-14 | `assignTripNumbers` | 날짜 고치기: T1, T2, T3에서 T3의 시작일을 2026-04-01로 고친 목록 | T3=1, T1=2, T2=3 | F-07 | v0.1 |
| LOGIC-15 | `assignTripNumbers` | 삭제: T1, T2, T3에서 T2를 뺀 목록 | T1=1, T3=2 (빈 번호 없이 다시 매김) | F-07 | v0.1 |
| LOGIC-16 | `assignTripNumbers` | 일기만 고침: T2의 `diary`, `updatedAt`만 바뀐 목록 | 번호 그대로 (T1=1, T2=2, T3=3) | F-07 | v0.1 |
| LOGIC-17 | `assignTripNumbers` | 종료일만 다름: T1의 종료일을 2026-12-31로 고침 | 번호 그대로 (종료일은 번호에 영향 없음) | F-07 | v0.1 |
| LOGIC-18 | `assignTripNumbers` | 넣은 목록 | 넣은 배열 자체는 바뀌지 않는다 (순수 함수) | F-07 | v0.1 |

### 3-3. 목록 정렬

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-20 | `sortTripsNewestFirst` | T1, T2, T3 (번호 매긴 뒤) | T3, T2, T1 (시작일이 늦은 것이 위) | F-02 | v0.1 |
| LOGIC-21 | `sortTripsNewestFirst` | S1, S2 (시작일 같음) | S2, S1 (나중에 기록한 S2가 위) | F-02 | v0.1 |
| LOGIC-22 | `assignTripNumbers` → `sortTripsNewestFirst` | T1, T2, T3, S1, S2 | 위에서부터 S2(5), S1(4), T3(3), T2(2), T1(1). 맨 위가 가장 큰 번호 | F-02, F-07 | v0.1 |
| LOGIC-23 | `sortTripsNewestFirst` | 넣은 목록 | 넣은 배열 자체는 바뀌지 않는다 | F-02 | v0.1 |

### 3-4. 지도 완성도

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-30 | `calcCompletion` | 가 본 곳 없음 | `0` | F-13 | v0.4 |
| LOGIC-31 | `calcCompletion` | A만 | `25` | F-13 | v0.4 |
| LOGIC-32 | `calcCompletion` | A, B (모든 지역) | 정확히 `100` (`=== 100`) | F-13 | v0.4 |
| LOGIC-33 | `calcCompletion` | A를 두 번 넣음 (`["99010", "99010"]`) | `25` (같은 지역은 한 번만 센다) | F-13 | v0.4 |
| LOGIC-34 | `formatPercent` | 0 | `"0%"` | F-13 | v0.4 |
| LOGIC-35 | `formatPercent` | 0.04 | `"0.1% 미만"` | F-13 | v0.4 |
| LOGIC-36 | `formatPercent` | 0.1 | `"0.1%"` | F-13 | v0.4 |
| LOGIC-37 | `formatPercent` | 12.345 | `"12.3%"` | F-13 | v0.4 |
| LOGIC-38 | `formatPercent` | 25 | `"25.0%"` | F-13 | v0.4 |
| LOGIC-39 | `formatPercent` | 100 | `"100%"` | F-13 | v0.4 |
| LOGIC-96 | `formatPercent` | 12.39 | `"12.3%"` (반올림이 아니라 버림) | F-13 | v0.4 |
| LOGIC-97 | `formatPercent` | 99.96 | `"99.9%"` (`"100.0%"`나 `"100%"`가 아니다) | F-13 | v0.4 |
| LOGIC-98 | `formatPercent` | 0.09 | `"0.1% 미만"` | F-13 | v0.4 |
| LOGIC-99 | `calcCompletion` → `formatPercent` | 넓이를 A=1, B=9999로 바꾸고 B만 가 봄 | `99.99` → `"99.9%"`. 다 다녀오지 않았으면 100%로 보이지 않는다 | F-13 | v0.4 |

### 3-4-1. 지형 무늬 (`src/lib/terrain.ts`)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-100 | `terrainHeight`, `terrainColor` | 같은 좌표(지리산 127.73, 35.34)로 두 번 부름 | 두 번 모두 같은 값 (무작위가 아니다) | F-12 | v0.4 |
| LOGIC-101 | `terrainHeight` | 여러 좌표 | 모두 0 이상 1 이하 | F-12 | v0.4 |
| LOGIC-102 | `terrainHeight` | 지리산(127.73, 35.34), 설악산(128.47, 38.12), 한라산(126.53, 33.36) vs 김제 평야(126.88, 35.80) | 세 산이 모두 평야보다 높다 (실제 산맥 자리) | F-12 | v0.4 |
| LOGIC-103 | `paintTerrain` | 2×2 그림, 왼쪽 위만 `null` | 길이 16. 왼쪽 위 투명(알파 0), 나머지는 불투명(알파 255)이고 `terrainColor`와 같은 색. 다시 불러도 같은 값 | F-12 | v0.4 |

### 3-5. 화면 글자 만들기

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-40 | `formatTripNumber` | 1 | `"첫 번째 여행"` | F-02, F-04 | v0.1 |
| LOGIC-41 | `formatTripNumber` | 2 | `"두 번째 여행"` | F-02, F-04 | v0.1 |
| LOGIC-42 | `formatTripNumber` | 10 | `"열 번째 여행"` | F-02, F-04 | v0.1 |
| LOGIC-43 | `formatTripNumber` | 11 | `"11번째 여행"` | F-02, F-04 | v0.1 |
| LOGIC-44 | `formatTripDates` | `("2026-05-03", null)` | `"2026.05.03 (당일치기)"` | F-02, F-04 | v0.1 |
| LOGIC-45 | `formatTripDates` | `("2026-05-03", "2026-05-03")` | `"2026.05.03 (당일치기)"` | F-02, F-04 | v0.1 |
| LOGIC-46 | `formatTripDates` | `("2026-05-03", "2026-05-04")` | `"2026.05.03 ~ 05.04"` | F-02, F-04 | v0.1 |
| LOGIC-47 | `formatTripDates` | `("2026-05-31", "2026-06-01")` (달을 넘김) | `"2026.05.31 ~ 06.01"` | F-02, F-04 | v0.1 |
| LOGIC-48 | `formatTripDates` | `("2025-12-31", "2026-01-01")` (해를 넘김) | `"2025.12.31 ~ 2026.01.01"` | F-02, F-04 | v0.1 |
| LOGIC-49 | `getErrorMessage` | COMPONENT_SPEC 5장 표의 코드 11개 각각 | 표에 적힌 문구와 글자 하나까지 같다 | F-03, F-05, F-06 | v0.1 |
| LOGIC-50 | `getErrorMessage` | 모르는 코드 `"SOMETHING_ELSE"` | `"문제가 생겼어요. 잠시 후 다시 시도해 주세요."` | F-03, F-05, F-06 | v0.1 |

### 3-6. "오늘" (한국 시간)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-60 | `getTodayInSeoul` | `2026-10-29T03:00:00Z` (한국 12:00) | `"2026-10-29"` | F-03, F-05 | v0.1 |
| LOGIC-61 | `getTodayInSeoul` | `2026-10-28T15:30:00Z` (한국 2026-10-29 새벽 00:30, UTC로는 전날) | `"2026-10-29"` (UTC 날짜 `10-28`이 아니다) | F-03, F-05 | v0.1 |
| LOGIC-62 | `getTodayInSeoul` | `2026-10-29T14:59:59Z` (한국 23:59:59) | `"2026-10-29"` | F-03, F-05 | v0.1 |
| LOGIC-63 | `getTodayInSeoul` | `2026-10-29T15:00:00Z` (한국 2026-10-30 00:00) | `"2026-10-30"` | F-03, F-05 | v0.1 |

### 3-7. 폼 값 바꾸기

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-70 | `toTripInput` | 종료일 `""` | 종료일 `null` | F-03, F-05 | v0.1 |
| LOGIC-71 | `toTripInput` | 종료일 `"2026-05-04"` | 그대로 `"2026-05-04"` | F-03, F-05 | v0.1 |
| LOGIC-72 | `toTripInput` | 시작일 `""` | 시작일 `""` 그대로 (검사에서 `START_DATE_REQUIRED`로 걸리게) | F-03 | v0.1 |
| LOGIC-73 | `toFormValue` | 종료일 `null`인 T2 | 종료일 `""` | F-05 | v0.1 |
| LOGIC-74 | `toFormValue` → `toTripInput` | T1을 바꿨다가 되돌림 | 날짜, 일기, 동네가 T1과 같다 | F-05 | v0.1 |

### 3-8. 구 합치기 (`src/lib`의 `toMergedRegionCode`)

DATA_MODEL 3장 규칙이다. 지도 파일과 코드 목록 파일을 만들 때 쓴다 (TRD 6장). 진짜 2026-10-01판 코드로 확인한다 (지도 모양은 쓰지 않으므로 가볍다).

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-80 | `toMergedRegionCode` | 수원시 장안구 `41111` | `41110` (수원시) | F-01 | v0.1 |
| LOGIC-81 | `toMergedRegionCode` | 부천시 오정구 `41196` | `41190` | F-01 | v0.1 |
| LOGIC-82 | `toMergedRegionCode` | 전주시 완산구 `52111` | `52110` | F-01 | v0.1 |
| LOGIC-83 | `toMergedRegionCode` | 증평군 `43745` (예외) | `43745` 그대로 (진천군 `43740`에 합쳐지면 안 됨) | F-01 | v0.1 |
| LOGIC-84 | `toMergedRegionCode` | 태안군 `44825` (예외) | `44825` 그대로 | F-01 | v0.1 |
| LOGIC-85 | `toMergedRegionCode` | 서울 광진구 `11215` (특별시의 구) | `11215` 그대로 | F-01 | v0.1 |
| LOGIC-86 | `toMergedRegionCode` | 인천 미추홀구 `28177` (광역시의 구) | `28177` 그대로 | F-01 | v0.1 |
| LOGIC-87 | `toMergedRegionCode` | 대구 군위군 `27720` | `27720` 그대로 (대구 소속) | F-01 | v0.1 |
| LOGIC-88 | 코드 목록 파일 | 만든 파일 전체 | 시·군·구 코드가 겹치지 않고, 수원·성남·고양 등 구가 있는 시는 시 하나로만 있다 | F-01 | v0.1 |

### 3-9. 글자 세기와 자르기 (`countDiaryChars`, `cutToMaxChars`)

화면(DiaryField)과 화면의 Zod 규칙이 같은 함수를 쓴다. 백엔드는 파이썬 `count_diary_chars`를 따로 두고, 같은 값으로 BE-01~04에서 확인한다.

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| LOGIC-90 | `countDiaryChars` | `""` | `0` | F-03 | v0.1 |
| LOGIC-91 | `countDiaryChars` | `"가😀a"` | `3` | F-03 | v0.1 |
| LOGIC-92 | `countDiaryChars` | 😀 2,000개 (JavaScript `length`로는 4,000) | `2000` | F-03 | v0.1 |
| LOGIC-93 | `countDiaryChars` | 가족 이모지 `"👨‍👩‍👧"` (눈에는 1개, 문자 5개를 이어 붙인 것) | `5` (DB가 세는 수와 같다) | F-03 | v0.1 |
| LOGIC-94 | `cutToMaxChars` | "가" 2,100자, max 2,000 | "가" 2,000자 | F-03 | v0.1 |
| LOGIC-95 | `cutToMaxChars` | "가" 1,999자 + `"😀😀"`, max 2,000 | "가" 1,999자 + `"😀"` (이모지가 반으로 쪼개지지 않는다) | F-03 | v0.1 |

### 3-10. 백엔드 함수 (BE, pytest)

화면 쪽 짝 함수와 **같은 값, 같은 결과**다. 화면과 백엔드의 결과가 어긋나지 않게 하는 테스트다 (TRD 5장).

| ID | 대상 | 상황 | 기대 결과 | 화면 쪽 짝 | 기능 | 버전 |
|---|---|---|---|---|---|---|
| BE-01 | `count_diary_chars` | `""` | `0` | LOGIC-90 | F-03 | v0.2 |
| BE-02 | `count_diary_chars` | `"가😀a"` | `3` | LOGIC-91 | F-03 | v0.2 |
| BE-03 | `count_diary_chars` | 😀 2,000개 | `2000` | LOGIC-92 | F-03 | v0.2 |
| BE-04 | `count_diary_chars` | 가족 이모지 `"👨‍👩‍👧"` | `5` (DB가 세는 수와 같다) | LOGIC-93 | F-03 | v0.2 |
| BE-05 | `today_in_seoul` | `2026-10-29T03:00:00Z` (한국 12:00) | `"2026-10-29"` | LOGIC-60 | F-03, F-05 | v0.2 |
| BE-06 | `today_in_seoul` | `2026-10-28T15:30:00Z` (한국 2026-10-29 새벽 00:30) | `"2026-10-29"` (UTC 날짜 `10-28`이 아니다) | LOGIC-61 | F-03, F-05 | v0.2 |
| BE-07 | `today_in_seoul` | `2026-10-29T14:59:59Z` (한국 23:59:59) | `"2026-10-29"` | LOGIC-62 | F-03, F-05 | v0.2 |
| BE-08 | `today_in_seoul` | `2026-10-29T15:00:00Z` (한국 2026-10-30 00:00) | `"2026-10-30"` | LOGIC-63 | F-03, F-05 | v0.2 |

- BE-05~08은 Windows에서도 통과해야 한다 (`tzdata` 패키지가 없으면 Asia/Seoul을 찾지 못한다, TRD 8장)

## 4. VAL (입력 검사)

- 화면(v0.1의 TripStore, TripForm)은 Zod 규칙(`validateNewTrip`, `validateTripUpdate`)으로, 백엔드(v0.2~)는 파이썬 검사 함수로 검사한다
- 두 곳은 코드를 같이 쓰지 않으므로 **아래 표 하나를 화면(Jest)과 백엔드(pytest)에서 각각 테스트한다.** 같은 상황이면 같은 에러 코드가 나와야 한다
- 백엔드에서는 "대상" 칸의 "새 여행 규칙"·"수정 규칙"을 백엔드의 같은 역할 함수로 읽는다. 버전 칸이 v0.1이어도 백엔드 테스트는 v0.2부터다
- "모르는 필드", "타입이 틀림"(VAL-50~52, 54, 56)은 백엔드에서 Pydantic 모델이 거른다. 이것도 같은 에러 코드(`INVALID_REQUEST`)여야 한다
- 따로 적지 않으면 검사하는 값은 아래 "정상 값"에서 한 칸만 바꾼 것이다
- 정상 값: `{ regionCode: "99010", startDate: "2026-10-01", endDate: null, diary: "", dongCodes: [] }`

### 4-1. 시작일

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| VAL-01 | 새 여행 규칙 | 정상 값 | 통과 | F-03 | v0.1 |
| VAL-02 | 새 여행 규칙 | `startDate` 필드가 없음 | `START_DATE_REQUIRED` | F-03 | v0.1 |
| VAL-03 | 새 여행 규칙 | `startDate: null` | `START_DATE_REQUIRED` | F-03 | v0.1 |
| VAL-04 | 새 여행 규칙 | `startDate: ""` (빈 시작일) | `START_DATE_REQUIRED` | F-03 | v0.1 |
| VAL-05 | 새 여행 규칙 | `startDate: "2026/05/03"` | `INVALID_DATE` | F-03 | v0.1 |
| VAL-06 | 새 여행 규칙 | `startDate: "2026-02-30"` (없는 날짜) | `INVALID_DATE` | F-03 | v0.1 |
| VAL-07 | 새 여행 규칙 | 오늘 = `2026-10-29`, `startDate: "2026-10-29"` | 통과 (오늘은 된다) | F-03 | v0.1 |
| VAL-08 | 새 여행 규칙 | 오늘 = `2026-10-29`, `startDate: "2026-10-30"` (미래 날짜) | `START_DATE_IN_FUTURE` | F-03 | v0.1 |
| VAL-09 | 새 여행 규칙 | 지금 = `2026-10-28T15:30:00Z` (한국 10-29 새벽 00:30, UTC로는 전날), `startDate: "2026-10-29"` | 통과 (막히지 않는다) | F-03 | v0.1 |
| VAL-10 | 새 여행 규칙 | 지금 = `2026-10-29T14:59:59Z` (한국 23:59:59), `startDate: "2026-10-30"` | `START_DATE_IN_FUTURE` | F-03 | v0.1 |
| VAL-11 | 새 여행 규칙 | 지금 = `2026-10-29T15:00:00Z` (한국 10-30 00:00), `startDate: "2026-10-30"` | 통과 | F-03 | v0.1 |

### 4-2. 종료일

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| VAL-20 | 새 여행 규칙 | `endDate` 필드가 없음 | 통과. 당일치기로 `null`이 된다 | F-03 | v0.1 |
| VAL-21 | 새 여행 규칙 | 시작일 `2026-10-01`, 종료일 `2026-10-01` (같은 날) | 통과 | F-03 | v0.1 |
| VAL-22 | 새 여행 규칙 | 시작일 `2026-10-02`, 종료일 `2026-10-01` | `END_DATE_BEFORE_START` | F-03 | v0.1 |
| VAL-23 | 새 여행 규칙 | 오늘 = `2026-10-29`, 시작일 `2026-10-29`, 종료일 `2026-10-30` (미래 종료일) | 통과 (종료일은 미래여도 된다) | F-03 | v0.1 |
| VAL-24 | 새 여행 규칙 | `endDate: "2026-13-01"` | `INVALID_DATE` | F-03 | v0.1 |

### 4-3. 여행일기와 글자 수

글자 수는 "문자 하나를 1자"로 센다 (API_SPEC 5장). 이모지 😀는 1자다. 화면의 남은 글자 수(UI-46~49)와 화면 검사는 같은 함수 `countDiaryChars`(LOGIC-90~93)로, 백엔드 검사는 `count_diary_chars`(BE-01~04)로 센다.

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| VAL-30 | 새 여행 규칙 | `diary` 필드가 없음 | 통과. `""`이 된다 | F-03 | v0.1 |
| VAL-31 | 새 여행 규칙 | "가" 2,000자 | 통과 | F-03 | v0.1 |
| VAL-32 | 새 여행 규칙 | "가" 2,001자 | `DIARY_TOO_LONG` | F-03 | v0.1 |
| VAL-33 | 새 여행 규칙 | 😀 2,000개 (JavaScript `length`로는 4,000) | 통과 (2,000자로 센다) | F-03 | v0.1 |
| VAL-34 | 새 여행 규칙 | 😀 2,001개 | `DIARY_TOO_LONG` | F-03 | v0.1 |
| VAL-35 | 새 여행 규칙 | "가" 1,999자 + 😀 1개 | 통과 (2,000자) | F-03 | v0.1 |
| VAL-36 | 새 여행 규칙 | "가" 1,999자 + 😀 2개 | `DIARY_TOO_LONG` (2,001자) | F-03 | v0.1 |
| VAL-37 | 새 여행 규칙 | "가😀a" | 3자로 세어 통과. 화면은 Zod 규칙이 `countDiaryChars`를 쓰는지(UI-47과 같은 함수), 백엔드는 `count_diary_chars`를 쓰는지 확인한다 | F-03 | v0.1 |

### 4-4. 지역과 동네

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| VAL-40 | 새 여행 규칙 | `regionCode: "9901"` (4자리) | `INVALID_REGION_CODE` | F-03 | v0.1 |
| VAL-41 | 새 여행 규칙 | `regionCode: "99999"` (형식은 맞지만 코드 목록에 없음) | `INVALID_REGION_CODE` | F-03 | v0.1 |
| VAL-42 | 새 여행 규칙 | 동네 코드 목록이 비어 있을 때(v0.3까지는 늘 이랬다), `dongCodes: ["9901010100"]` | `INVALID_DONG_CODE` | F-03 | v0.1 |
| VAL-43 | 새 여행 규칙 | A 지역, `dongCodes: ["9901010100", "9901010200"]` | 통과 | F-11 | v0.4 |
| VAL-44 | 새 여행 규칙 | A 지역, `dongCodes: ["9902010100"]` (B의 동네) | `INVALID_DONG_CODE` | F-11 | v0.4 |
| VAL-45 | 새 여행 규칙 | A 지역, `dongCodes: ["9999999999"]` (없는 동네) | `INVALID_DONG_CODE` | F-11 | v0.4 |
| VAL-46 | 새 여행 규칙 | A 지역, `dongCodes: ["99010"]` (10자리가 아님) | `INVALID_DONG_CODE` | F-11 | v0.4 |
| VAL-47 | 새 여행 규칙 | A 지역, `dongCodes: ["9901010100", "9901010100"]` | `DUPLICATE_DONG_CODE` | F-11 | v0.4 |

### 4-5. 모양과 검사 순서

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| VAL-50 | 새 여행 규칙 | 모르는 필드 `{ ..., "note": "x" }` | `INVALID_REQUEST` | F-03 | v0.1 |
| VAL-51 | 새 여행 규칙 | `diary: 123` (타입이 틀림) | `INVALID_REQUEST` | F-03 | v0.1 |
| VAL-52 | 새 여행 규칙 | `regionCode` 필드가 없음 | `INVALID_REQUEST` (시작일이 아닌 필드가 빠짐) | F-03 | v0.1 |
| VAL-53 | 수정 규칙 | `{ startDate, endDate, diary, dongCodes }` 모두 있음 | 통과 | F-05 | v0.1 |
| VAL-54 | 수정 규칙 | `diary` 필드가 없음 | `INVALID_REQUEST` (수정은 4개 필드 모두 필요) | F-05 | v0.1 |
| VAL-55 | 수정 규칙 | `startDate` 필드가 없음 | `START_DATE_REQUIRED` | F-05 | v0.1 |
| VAL-56 | 수정 규칙 | `regionCode`를 보냄 | `INVALID_REQUEST` (지역은 고칠 수 없다) | F-05 | v0.1 |
| VAL-57 | 새 여행 규칙 | 시작일 없음 + 일기 2,001자 | `START_DATE_REQUIRED` (먼저 걸린 것 하나만) | F-03 | v0.1 |
| VAL-58 | 새 여행 규칙 | 시작일이 미래 + 종료일이 시작일보다 빠름 | `START_DATE_IN_FUTURE` | F-03 | v0.1 |
| VAL-59 | 새 여행 규칙 | 종료일이 시작일보다 빠름 + 일기 2,001자 | `END_DATE_BEFORE_START` | F-03 | v0.1 |

## 5. UI (컴포넌트)

- 지도는 2장의 **가짜 지도 데이터(사각형 2개)**로 그린다
- 저장소는 가짜 `TripStore`를 넣어, 어떤 함수가 몇 번 불렸는지 확인한다
- 문구는 COMPONENT_SPEC에 적힌 글자 그대로 찾는다

### 5-1. 지도 (MapView, HomePage)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-01 | MapView | 가짜 지도로 그림 | "테스트시 가구", "테스트시 나구" 두 지역이 보인다 (화면 읽기용 이름으로 찾는다) | F-01 | v0.1 |
| UI-02 | MapView | `visitCounts = { "99010": 1 }` | A는 연두색(`once`), B는 흰색(`none`) | F-08 | v0.1 |
| UI-03 | MapView | `visitCounts = { "99010": 2 }` | A는 진한 초록(`many`) | F-08 | v0.1 |
| UI-04 | MapView | `visitCounts = { "99010": 2 }` | A가 지형 무늬로 칠해진다 (무늬가 붙었는지만 확인. 생김새는 MANUAL-01) | F-12 | v0.4 |
| UI-05 | MapView | A를 짧게 누름 | `onRegionClick("99010")`이 한 번 불린다 | F-01, F-02 | v0.1 |
| UI-06 | MapView | A 위에서 누른 채 끌다가 A 위에서 손을 뗌 | `onRegionClick`이 불리지 않는다 (지역을 누른 것으로 치지 않음) | F-16 | v0.1 |
| UI-98 | MapView | A를 움직이지 않고 짧게 누르는데, 손을 뗄 때의 대상이 지도 전체(`<svg>`)로 바뀜 (진짜 브라우저에서 마우스를 붙잡으면 이렇게 된다) | `onRegionClick("99010")`이 한 번 불린다 | F-01, F-02 | v0.1 |
| UI-07 | MapView | 마우스 휠로 확대 | `onViewportChange`가 불리고 `scale`이 1보다 크다 | F-16 | v0.1 |
| UI-08 | MapView | 끌어서 옮김 | `onViewportChange`가 불리고 `x` 또는 `y`가 바뀐다 | F-16 | v0.1 |
| UI-09 | MapView | `viewport = { scale: 2, x: 10, y: 20 }`으로 그림 | 그 확대 상태로 그려진다 | F-16 | v0.1 |
| UI-10 | MapView | `viewport = null` | 전국(가짜 지도 전체)이 보이는 처음 상태 | F-16 | v0.1 |
| UI-11 | HomePage + MapViewportProvider | 확대 → 지역 화면으로 이동 → 뒤로 돌아옴 | 돌아오기 전과 같은 확대 상태 | F-16 | v0.1 |
| UI-12 | HomePage + MapViewportProvider | 확대한 뒤 Provider를 새로 만듦 (새로고침과 같음) | 처음 상태 (`viewport = null`) | F-16 | v0.1 |
| UI-13 | HomePage | 지도 파일을 불러오는 중 | "지도를 불러오는 중이에요…" | F-01 | v0.1 |
| UI-14 | HomePage | 지도 파일 불러오기 실패 | "지도를 불러오지 못했어요." + "다시 시도" 버튼. 누르면 다시 불러온다 | F-01 | v0.1 |
| UI-15 | HomePage | 여행 목록 불러오기 실패 | "여행 기록을 불러오지 못했어요. 지도는 빈 상태로 보여요." + "다시 시도". 지도는 모두 흰색 | F-08 | v0.2 |
| UI-16 | HomePage | 여행이 하나도 없음 | "다녀온 지역을 눌러 첫 여행을 기록해 보세요." | F-01 | v0.1 |
| UI-17 | HomePage | 여행이 있음 | 위 안내 문구가 없다 | F-01 | v0.1 |
| UI-18 | CompletionBadge | A에 여행 1개 | "지도 완성도 25.0%" | F-13 | v0.4 |
| UI-19 | CompletionBadge | 여행 없음 | "지도 완성도 0%" | F-13 | v0.4 |

### 5-2. 지역 화면 (RegionPage, TripList)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-20 | RegionPage | `/regions/99010` | 제목 "테스트시 가구" (코드 목록 파일의 이름) | F-02 | v0.1 |
| UI-21 | RegionPage | A에 T1, T2, T3 | 위에서부터 "세 번째 여행", "두 번째 여행", "첫 번째 여행" | F-02, F-07 | v0.1 |
| UI-22 | RegionPage | A에 S1, S2 (시작일 같음) | 위에서부터 S2 "두 번째 여행", S1 "첫 번째 여행" | F-02, F-07 | v0.1 |
| UI-23 | TripListItem | T2 (당일치기) | "두 번째 여행" 아래에 "2026.06.01 (당일치기)" | F-02 | v0.1 |
| UI-24 | TripListItem | T3 | "2026.07.01 ~ 07.03" | F-02 | v0.1 |
| UI-25 | TripListItem | 여행 하나를 누름 | 그 여행의 상세 주소로 이동 | F-04 | v0.1 |
| UI-26 | RegionPage | 여행이 없음 | "아직 이 지역의 여행 기록이 없어요." + "새 여행 기록" 버튼 | F-02 | v0.1 |
| UI-27 | RegionPage | 불러오는 중 | "여행 목록을 불러오는 중이에요…" | F-02 | v0.1 |
| UI-28 | RegionPage | 불러오기 실패 | "여행 목록을 불러오지 못했어요." + "다시 시도" | F-02 | v0.2 |
| UI-29 | RegionPage | `/regions/99999` (없는 지역) | "지역을 찾을 수 없어요. 지도에서 다시 골라 주세요." + "지도로 가기" | F-02 | v0.1 |
| UI-30 | PageHeader | 지역 화면에서 "‹ 뒤로"를 누름 | 첫 화면(`/`)으로 이동. 버튼의 화면 읽기용 이름은 "뒤로 가기" | F-02 | v0.1 |
| UI-31 | RegionPage | "새 여행 기록" 버튼을 누름 | `/regions/99010/trips/new`로 이동 | F-03 | v0.1 |

### 5-3. 새 여행 기록·수정 (TripForm)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-40 | TripForm | 새 여행 기록 화면을 엶 | 제목 "새 여행 기록", 칸 이름 "시작일 (필수)", "종료일", "여행일기", 안내 "비워 두면 당일치기로 저장돼요.", 버튼 "저장", "취소" | F-03 | v0.1 |
| UI-41 | DateFields | 오늘 = `2026-10-29` | 시작일 칸의 가장 늦은 날짜가 `2026-10-29`. 종료일 칸에는 제한이 없다 | F-03 | v0.1 |
| UI-42 | TripForm | 시작일 없이 저장 | 시작일 칸 아래 "시작일을 입력해 주세요.". `createTrip`이 불리지 않는다 | F-03 | v0.1 |
| UI-43 | TripForm | 종료일이 시작일보다 빠른 채 저장 | 종료일 칸 아래 "종료일은 시작일보다 빠를 수 없어요.". 저장되지 않는다 | F-03 | v0.1 |
| UI-44 | TripForm | 시작일과 종료일을 둘 다 형식에 안 맞게 넣고 저장 | 두 칸 아래에 각각 "날짜 형식이 올바르지 않아요." | F-03 | v0.1 |
| UI-45 | TripForm | 시작일만 넣고 저장 | `createTrip`이 `endDate: null`, `diary: ""`, `dongCodes: []`로 한 번 불린다 | F-03 | v0.1 |
| UI-46 | DiaryField | 처음 | "남은 글자 2,000자", 칸 안 안내 "이 여행에서 있었던 일을 적어 보세요." | F-03 | v0.1 |
| UI-47 | DiaryField | "가😀" 입력 | "남은 글자 1,998자" (😀를 1자로 센다. VAL-37과 같은 수) | F-03 | v0.1 |
| UI-48 | DiaryField | 1,999자에서 😀 입력 | 들어간다. "남은 글자 0자" | F-03 | v0.1 |
| UI-49 | DiaryField | 2,000자에서 한 글자 더 입력 | 들어가지 않는다. 값은 2,000자 그대로 | F-03 | v0.1 |
| UI-95 | DiaryField | 빈 칸에 "가" 2,100자를 붙여 넣음 | 2,000자까지만 들어간다. "남은 글자 0자"와 "2,000자까지만 쓸 수 있어요."가 보인다 | F-03 | v0.1 |
| UI-96 | DiaryField | "가" 1,999자 상태에서 `"😀😀"`를 붙여 넣음 | "가" 1,999자 + 😀 1개만 들어간다 (이모지가 깨지지 않는다). "2,000자까지만 쓸 수 있어요."가 보인다 | F-03 | v0.1 |
| UI-97 | DiaryField | 2,000자를 넘지 않게 붙여 넣음 | "2,000자까지만 쓸 수 있어요."가 보이지 않는다 | F-03 | v0.1 |
| UI-50 | TripForm | 저장을 누른 뒤 응답을 기다리는 중 | 버튼이 "저장 중…"이고 누를 수 없다. 두 번 눌러도 `createTrip`은 한 번만 불린다 | F-03 | v0.1 |
| UI-51 | NewTripPage | 저장 성공 | 지역 화면으로 이동하고, 새 여행이 번호와 함께 목록에 보인다 | F-03, F-07 | v0.1 |
| UI-52 | TripForm | 저장 결과 `INTERNAL_ERROR` | 폼 위쪽에 "잠시 후 다시 시도해 주세요." | F-03 | v0.2 |
| UI-53 | TripForm | 서버에 닿지 못함 | 폼 위쪽에 "인터넷 연결을 확인하고 다시 시도해 주세요." | F-03 | v0.2 |
| UI-54 | TripForm | 서버가 `START_DATE_IN_FUTURE`를 돌려줌 (화면 검사를 지나친 경우) | 시작일 칸 아래 "시작일은 오늘까지만 고를 수 있어요." | F-03 | v0.2 |
| UI-55 | TripForm | "취소"를 누름 | `onCancel`이 불리고 앞 화면으로 돌아간다. 저장되지 않는다 | F-03 | v0.1 |
| UI-56 | EditTripPage | T2(종료일 `null`)를 수정 화면으로 엶 | 제목 "여행 수정", 종료일 칸이 비어 있다, 지역을 바꾸는 칸이 없다 | F-05 | v0.1 |
| UI-57 | EditTripPage | T2의 일기만 고쳐 저장 | `updateTrip`이 `endDate: null`로 불리고, 여행 상세로 이동한다 | F-05 | v0.1 |
| UI-58 | EditTripPage | T3의 시작일을 2026-04-01로 고쳐 저장한 뒤 지역 화면을 봄 | T3가 "첫 번째 여행", T1이 "두 번째 여행", T2가 "세 번째 여행"으로 바뀌어 보인다 | F-05, F-07 | v0.1 |

### 5-4. 동네 선택 (DongPicker, v0.4)

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-60 | DongPicker | A 지역 | 칸 이름 "다녀온 동네", 안내 "여러 곳을 고를 수 있어요.", 선택지 "가동", "나동"만 보인다 (B의 "다동"은 없다) | F-11 | v0.4 |
| UI-61 | DongPicker | "가동"을 누름 | `onChange(["9901010100"])` | F-11 | v0.4 |
| UI-62 | DongPicker | 고른 "가동"을 다시 누름 | `onChange([])` (빠진다. 두 번 들어가지 않는다) | F-11 | v0.4 |
| UI-63 | TripForm | 동네 목록 불러오는 중 / 실패 | "동네 목록을 불러오는 중이에요…" / "동네 목록을 불러오지 못했어요." + "다시 시도" | F-11 | v0.4 |

### 5-5. 여행 상세와 삭제

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-70 | TripDetailPage | T2 상세 | 제목 "두 번째 여행", 날짜 "2026.06.01 (당일치기)", 버튼 "수정", "삭제" | F-04 | v0.1 |
| UI-71 | TripDetail | 일기가 `""` | "작성한 여행일기가 없어요." | F-04 | v0.1 |
| UI-72 | TripDetail | 동네를 안 고른 여행 | "다녀온 동네" 아래 "고른 동네가 없어요." | F-04, F-11 | v0.4 |
| UI-73 | TripDetail | 동네 "가동", "나동"을 고른 여행 | "가동", "나동"이 보인다 | F-04, F-11 | v0.4 |
| UI-74 | TripDetailPage | 없는 여행 id | "여행을 찾을 수 없어요. 이미 삭제되었을 수 있어요." + "지역 화면으로" | F-04 | v0.1 |
| UI-75 | TripDetailPage | v0.1에서 새로고침 (빈 TripStoreProvider로 상세 주소를 엶) | UI-74와 같은 문구 (정상) | F-04 | v0.1 |
| UI-76 | DeleteTripButton | "삭제"를 누름 | 확인 창: 제목 "정말 지울까요?", 내용 "삭제한 여행은 되돌릴 수 없어요.", 버튼 "삭제", "취소". 아직 `deleteTrip`은 불리지 않는다 | F-06 | v0.1 |
| UI-77 | ConfirmDialog | "취소"를 누름 | 창이 닫히고 `deleteTrip`이 불리지 않는다 | F-06 | v0.1 |
| UI-78 | ConfirmDialog | "삭제"를 누름 | `deleteTrip`이 한 번 불리고, 기다리는 동안 버튼이 "삭제 중…" | F-06 | v0.1 |
| UI-79 | TripDetailPage | T1, T2, T3 중 T2를 삭제 성공 | 지역 화면으로 이동. T3가 "두 번째 여행", T1이 "첫 번째 여행"으로 보인다 | F-06, F-07 | v0.1 |
| UI-80 | TripDetailPage | 삭제 결과 `INTERNAL_ERROR` | "잠시 후 다시 시도해 주세요." + "다시 시도" | F-06 | v0.2 |

### 5-6. 공통

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| UI-90 | AttributionFooter | 첫 화면, 지역 화면, 새 여행 기록, 여행 상세, 여행 수정 각각 | 맨 아래에 "지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)" | (라이선스) | v0.1 |
| UI-91 | AttributionFooter | "admdongkor" 링크 | 주소가 `https://github.com/vuski/admdongkor`이고 새 탭에서 열린다 | (라이선스) | v0.1 |
| UI-92 | RootLayout | 아무 화면 | 브라우저 탭 제목 "나만의 여행 지도" | F-01 | v0.1 |
| UI-93 | TripStoreProvider (v0.1) | 새 여행 기록 → 첫 화면 → 지역 화면으로 이동 | 기록한 여행이 남아 있다 (페이지를 옮겨도 사라지지 않음) | F-03 | v0.1 |
| UI-94 | TripStoreProvider (v0.1) | 시작일이 미래인 여행을 `createTrip` | `START_DATE_IN_FUTURE` 에러 (API와 같은 코드) | F-03 | v0.1 |

## 6. API

- 백엔드(`backend/tests/`)에서 pytest + FastAPI TestClient로 부른다
- 따로 적지 않으면 v0.2(서버 메모리)와 v0.3(DB) 모두에서 같은 결과여야 한다
- v0.3 이후의 DB 테스트는 테스트용 DB를 쓴다. DB 주소는 `backend/.env`에만 두고 테스트 코드에 적지 않는다
- 서버의 "지금 시각", 저장소, 코드 목록은 의존성을 바꿔 끼워 테스트에서 정해 준다. 테스트마다 빈 저장소로 시작한다
- 모든 에러 응답은 `{ "error": { "code": "...", "message": "..." } }` 모양이다 (API-60, API-61)

### 6-1. 목록 `GET /api/trips`

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| API-01 | GET `/api/trips` | 여행 없음 | `200`, `{ "trips": [] }` | F-02 | v0.2 |
| API-02 | GET `/api/trips` | T1, B1 저장됨 | `200`, 두 여행 모두 | F-08 | v0.2 |
| API-03 | GET `/api/trips?regionCode=99010` | T1, B1 저장됨 | `200`, T1만 | F-02 | v0.2 |
| API-04 | GET `/api/trips?regionCode=abc` | | `400`, `INVALID_REGION_CODE` | F-02 | v0.2 |
| API-05 | GET `/api/trips?regionCode=99999` | | `400`, `INVALID_REGION_CODE` | F-02 | v0.2 |
| API-06 | GET `/api/trips` | 아무 여행 | 응답에 `tripNumber` 같은 계산 값이 없다. 필드는 `Trip`의 8개뿐 | F-07 | v0.2 |
| API-07 | GET `/api/trips` | 아무 여행 | 필드 이름이 camelCase다 (`startDate`, `createdAt` 등. `start_date`가 아니다). `createdAt`·`updatedAt`은 `"2026-05-05T09:12:30.000Z"`처럼 밀리초 3자리 + `Z` 모양 | F-02 | v0.2 |

### 6-2. 추가 `POST /api/trips`

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| API-10 | POST | `{ regionCode: "99010", startDate: "2026-10-01" }` | `201`, `trip.endDate`는 `null`, `diary`는 `""`, `dongCodes`는 `[]`, `id`가 있고 `createdAt`과 `updatedAt`이 같다 | F-03 | v0.2 |
| API-11 | POST → GET | API-10 다음에 GET | 방금 만든 여행이 목록에 있다 | F-03 | v0.2 |
| API-12 | POST | 깨진 JSON `{ "regionCode": ` | `400`, `INVALID_REQUEST` | F-03 | v0.2 |
| API-13 | POST | 빈 시작일 `startDate: ""` | `400`, `START_DATE_REQUIRED` | F-03 | v0.2 |
| API-14 | POST | 오늘 = 2026-10-29, `startDate: "2026-10-30"` (미래 날짜) | `400`, `START_DATE_IN_FUTURE` | F-03 | v0.2 |
| API-15 | POST | 서버 시각 `2026-10-28T15:30:00Z` (한국 10-29 새벽), `startDate: "2026-10-29"` | `201` (막히지 않는다) | F-03 | v0.2 |
| API-16 | POST | 종료일이 시작일보다 빠름 | `400`, `END_DATE_BEFORE_START` | F-03 | v0.2 |
| API-17 | POST | 일기 2,001자 | `400`, `DIARY_TOO_LONG` | F-03 | v0.2 |
| API-18 | POST → GET | 일기 😀 2,000개 | `201`. GET으로 받은 일기가 보낸 것과 똑같다 (서버가 2,000자로 세고, DB도 거부하지 않는다) | F-03 | v0.3 |
| API-19 | POST | 일기 😀 2,001개 | `400`, `DIARY_TOO_LONG` | F-03 | v0.2 |
| API-20 | POST | `regionCode: "99999"` | `400`, `INVALID_REGION_CODE` | F-03 | v0.2 |
| API-21 | POST | 동네 코드 목록이 비어 있을 때(v0.3까지는 늘 이랬다), `dongCodes`에 값이 있음 | `400`, `INVALID_DONG_CODE` | F-03 | v0.2 |
| API-22 | POST | A 지역에 B의 동네 | `400`, `INVALID_DONG_CODE` | F-11 | v0.4 |
| API-23 | POST | 같은 동네 두 번 | `400`, `DUPLICATE_DONG_CODE` | F-11 | v0.4 |
| API-24 | POST | 모르는 필드 | `400`, `INVALID_REQUEST` | F-03 | v0.2 |
| API-25 | POST | camelCase 대신 snake_case로 보냄 `{ regionCode: "99010", start_date: "2026-10-01" }` | `400`, `INVALID_REQUEST` (`start_date`는 모르는 필드다) | F-03 | v0.2 |
| API-26 | POST | `diary: 123` (타입이 틀림) | `400`, `INVALID_REQUEST` (글자로 바꿔 저장하지 않는다) | F-03 | v0.2 |

### 6-3. 수정 `PUT /api/trips/{id}`

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| API-30 | PUT | T2의 일기만 바꿈 (4개 필드 모두 보냄) | `200`, `diary`가 바뀌고, `updatedAt`이 바뀌고, `createdAt`과 `regionCode`는 그대로 | F-05 | v0.2 |
| API-31 | PUT | `diary` 필드를 빼고 보냄 | `400`, `INVALID_REQUEST`. 저장된 일기는 그대로 | F-05 | v0.2 |
| API-32 | PUT | `startDate` 필드를 빼고 보냄 | `400`, `START_DATE_REQUIRED` | F-05 | v0.2 |
| API-33 | PUT | `regionCode`를 보냄 | `400`, `INVALID_REQUEST` | F-05 | v0.2 |
| API-34 | PUT | 없는 id + 정상 내용 | `404`, `TRIP_NOT_FOUND` | F-05 | v0.2 |
| API-35 | PUT | 없는 id + 틀린 내용 (빈 시작일, 일기 2,001자) | `404`, `TRIP_NOT_FOUND` (내용 검사보다 404가 먼저) | F-05 | v0.2 |
| API-36 | PUT | id가 uuid 형식이 아님 (`abc`) | `404`, `TRIP_NOT_FOUND` | F-05 | v0.2 |
| API-37 | PUT | 종료일이 시작일보다 빠름 | `400`, `END_DATE_BEFORE_START` | F-05 | v0.2 |
| API-38 | PUT → GET | T3의 시작일을 2026-04-01로 고친 뒤 A 목록을 받아 `assignTripNumbers` | T3=1, T1=2, T2=3 | F-05, F-07 | v0.2 |

### 6-4. 삭제 `DELETE /api/trips/{id}`

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| API-40 | DELETE | T2 | `204`, 본문 없음 | F-06 | v0.2 |
| API-41 | DELETE → GET | API-40 다음에 GET | T2가 목록에 없다 | F-06 | v0.2 |
| API-42 | DELETE | 없는 id | `404`, `TRIP_NOT_FOUND` | F-06 | v0.2 |
| API-43 | DELETE | 같은 id를 두 번 | 첫 번째 `204`, 두 번째 `404` | F-06 | v0.2 |
| API-44 | DELETE (DB) | T2를 지운 뒤 DB를 직접 봄 | 그 줄이 실제로 없다 ("지움" 표시만 남지 않음) | F-06 | v0.3 |

### 6-5. 저장 유지, 서버 문제, 에러 모양

| ID | 대상 | 상황 | 기대 결과 | 기능 | 버전 |
|---|---|---|---|---|---|
| API-50 | 서버 메모리 | 같은 서버에서 POST 뒤 GET을 여러 번 | 서버가 켜져 있는 동안 계속 남아 있다 | F-09 | v0.2 |
| API-51 | DB | POST → 앱을 새로 띄움(DB 연결을 새로 만듦) → GET | 기록이 남아 있다 | F-10 | v0.3 |
| API-52 | 서버 문제 | 저장소가 예외를 던지게 만듦 | `500`, `INTERNAL_ERROR`, 메시지 "잠시 후 다시 시도해 주세요." | F-09, F-10 | v0.2 |
| API-53 | 서버 문제 | API-52의 응답 본문 | DB 주소, 비밀번호, 서버 내부 오류 내용이 들어 있지 않다 | F-10 | v0.2 |
| API-60 | 에러 모양 | 위 API 테스트의 모든 에러 응답 | `{ "error": { "code", "message" } }` 모양이고, `code`는 API_SPEC 2장 표에 있는 값이다 | 전체 | v0.2 |
| API-61 | 에러 모양 | 위 API 테스트의 모든 에러 응답 | 상태 코드가 `422`인 것이 없고, FastAPI 기본 모양 `{ "detail": ... }`이 없다 | 전체 | v0.2 |
| API-62 | CORS | `Origin: http://localhost:3000`을 붙여 GET | 응답에 `Access-Control-Allow-Origin: http://localhost:3000`이 있다 | F-09 | v0.2 |
| API-63 | CORS | `Origin: http://evil.example`을 붙여 GET | 응답에 `Access-Control-Allow-Origin`이 없다 (허락한 주소만) | F-09 | v0.2 |

## 7. 기능 ID별 테스트

| 기능 | 테스트 |
|---|---|
| F-01 전국 지도 보기 | LOGIC-80~88, UI-01, UI-05, UI-13, UI-14, UI-16, UI-17, UI-92, MANUAL-04 |
| F-02 지역 여행 목록 | LOGIC-20~23, LOGIC-40~48, UI-20~31, API-01, API-03~05, API-07 |
| F-03 여행 추가 | LOGIC-60~63, LOGIC-70~72, LOGIC-90~95, BE-01~08, VAL-01~52, VAL-57~59, UI-40~55, UI-93~97, API-10~26 |
| F-04 여행 상세 | UI-25, UI-70~75 |
| F-05 여행 수정 | LOGIC-73, LOGIC-74, BE-05~08, VAL-53~56, UI-56~58, API-30~38 |
| F-06 여행 삭제 | UI-76~80, API-40~44 |
| F-07 여행 번호 매기기 | LOGIC-10~18, LOGIC-22, UI-21, UI-22, UI-58, UI-79, API-06, API-38 |
| F-08 지도 색칠 | LOGIC-01~06, UI-02, UI-03, UI-15, API-02, MANUAL-02 |
| F-09 서버에 기록 저장 | API-50, API-52, API-62, API-63 |
| F-10 기록 유지 | API-51, API-53, MANUAL-10 |
| F-11 동네 선택 | VAL-43~47, UI-60~63, UI-72, UI-73, API-22, API-23 |
| F-12 지형 무늬 색칠 | LOGIC-05, LOGIC-06, LOGIC-100~103, UI-04, MANUAL-01 |
| F-13 지도 완성도 | LOGIC-30~39, LOGIC-96~99, UI-18, UI-19, MANUAL-05 |
| F-14 배포 | MANUAL-10, MANUAL-11 |
| F-15 휴대폰 홈 화면 설치 | MANUAL-12, MANUAL-13 |
| F-16 지도 확대·이동 | UI-06~12, MANUAL-03 |

## 8. 눈으로 확인하는 테스트 (MANUAL)

자동 테스트로 확인하기 어려운 것이다. 버전을 올리기 전에 사람이 직접 보고 체크한다.

| ID | 확인할 것 | 어떻게 | 통과 기준 | 기능 | 버전 |
|---|---|---|---|---|---|
| MANUAL-01 | 지형 무늬가 위성에서 본 것처럼 보이는지 | 진짜 지도에서 두 번 이상 간 지역을 여러 개 만들어 본다 | 위성사진 같은 느낌이 나고, 흰색·연두색 지역과 확실히 구분된다. 확대해도 무늬가 깨지지 않는다 | F-12 | v0.4 |
| MANUAL-02 | 흰색·연두색·진한 초록이 잘 구분되는지 | 휴대폰과 컴퓨터 화면에서 본다. 햇빛 아래 휴대폰에서도 본다 | 세 단계가 한눈에 구분된다. 지역 경계선이 보인다 | F-08 | v0.1 |
| MANUAL-03 | 휴대폰에서 작은 지역을 누를 수 있는지 | 아이폰·안드로이드에서 두 손가락으로 확대해 서울의 구(예: 중구, 종로구)를 손가락으로 누른다 | 원하는 구가 눌린다. 확대·이동이 끊기지 않고 부드럽다. 옮기다가 지역 화면으로 넘어가지 않는다 | F-16 | v0.1 |
| MANUAL-04 | 진짜 지도 데이터가 맞게 보이는지 | 진짜 지도 파일로 첫 화면을 본다 | 군위군이 대구에 있다. 수원시·고양시 등이 구로 나뉘지 않고 시 하나다. 서울·부산 등의 구는 따로 있다. 제주도, 울릉도 같은 섬이 보인다 | F-01 | v0.1 |
| MANUAL-05 | 지도 완성도가 그럴듯한지 | 진짜 지도에서 큰 지역(예: 홍천군)과 작은 지역(예: 서울 중구)을 하나씩 기록해 본다 | 큰 지역이 훨씬 큰 %를 올린다. 작은 지역 하나만 가 봤을 때 "0.1% 미만"으로 보인다 | F-13 | v0.4 |
| MANUAL-06 | 휴대폰에서 화면이 깨지지 않는지 | 아이폰(Safari), 안드로이드(Chrome)에서 모든 화면을 세로·가로로 본다 | 글자·버튼이 잘리거나 겹치지 않는다. 가로로 밀어야 보이는 부분이 없다. 출처 줄이 지도를 가리지 않는다 | 전체 | v0.1 |
| MANUAL-07 | 컴퓨터 브라우저에서 화면이 깨지지 않는지 | Chrome 등에서 창을 좁게·넓게 바꿔 본다 | MANUAL-06과 같다. 마우스 휠 확대와 끌기가 된다 | 전체 | v0.1 |
| MANUAL-08 | 휴대폰 달력에서 미래 날짜가 막히는지 | 아이폰·안드로이드의 날짜 고르기 화면에서 내일을 고르려고 해 본다 | 고를 수 없거나, 골라도 저장할 때 "시작일은 오늘까지만 고를 수 있어요."가 뜬다 (기기마다 달력이 달라서 직접 본다) | F-03 | v0.1 |
| MANUAL-09 | 휴대폰 키보드로 이모지를 넣을 때 글자 수 | 휴대폰 키보드로 이모지를 섞어 일기를 쓴다 | "남은 글자"가 이모지 하나에 1씩 줄고, 저장도 된다 | F-03 | v0.1 |
| MANUAL-10 | 배포 주소에서 쓸 수 있는지 | 배포 주소로 휴대폰에서 접속해 여행을 추가·수정·삭제한다 | 모두 된다. 다음 날 다시 접속해도 기록이 남아 있다 | F-10, F-14 | v1.0 |
| MANUAL-11 | 배포 주소에 실제 개인 기록이 없는지 | 배포된 화면을 둘러본다 | 연습용 기록만 있다 (v2.0 전에는 누구나 볼 수 있으므로) | F-14 | v1.0 |
| MANUAL-12 | 휴대폰 홈 화면 설치 | 아이폰 Safari "홈 화면에 추가", 안드로이드 Chrome 설치 | 홈 화면에 앱 아이콘과 이름이 생기고, 누르면 주소창 없이 열린다 | F-15 | v1.0 |
| MANUAL-13 | 설치한 앱에서 뒤로 가기 | 설치한 앱에서 지역 화면 → 상세로 들어간 뒤 뒤로 가기(안드로이드 버튼, 아이폰 화면 왼쪽에서 밀기, "‹ 뒤로" 버튼) | 바로 앞 화면으로 돌아간다. 첫 화면으로 돌아오면 확대 상태가 그대로다 | F-15, F-16 | v1.0 |
| MANUAL-14 | 화면 읽기 프로그램 | 아이폰 VoiceOver, 안드로이드 TalkBack을 켜고 화면을 훑는다 | 지역 이름, "뒤로 가기", 버튼 글자가 제대로 읽힌다 | 전체 | v1.0 |

## 9. 앞 문서에 반영한 것

테스트를 쓰다가 앞 문서에 없다는 것을 알게 되어 정하고 반영한 부분이다.

| 정한 것 | 반영한 곳 | 테스트 |
|---|---|---|
| 글자 세기 함수 `countDiaryChars`는 `src/lib`에 하나만 두고 화면과 서버가 같이 쓴다 | COMPONENT_SPEC 3-8·4장, API_SPEC 5장, TRD 5장 | LOGIC-90~93, VAL-37, UI-47 |
| 2,000자 넘게 붙여 넣으면 2,000자까지만 들어가고 "2,000자까지만 쓸 수 있어요." 안내 | COMPONENT_SPEC 3-8·4장 (`cutToMaxChars`) | LOGIC-94·95, UI-95~97 |
| 완성도는 소수 첫째 자리까지 버림. 모든 지역을 가 봤을 때만 100% | COMPONENT_SPEC 3-3·4장, TRD 5장 | LOGIC-32, LOGIC-96~99 |
| 구 합치기 함수 `toMergedRegionCode`는 `src/lib`에 둔다 | COMPONENT_SPEC 4장, TRD 5장·6장 | LOGIC-80~88 |
| 백엔드를 FastAPI로 바꿈 (v0.2). 화면과 백엔드가 코드를 같이 쓸 수 없어, 백엔드는 `count_diary_chars`·`today_in_seoul`과 검사 함수를 따로 두고 같은 값으로 테스트한다. 위 첫 줄의 "화면과 서버가 같이 쓴다"는 이제 화면 안에서만 해당한다 | TRD 5장·8장, API_SPEC 5장 | BE-01~08, VAL 전체(pytest), API-07, API-25~26, API-61~63 |

- VAL-42, API-21은 v0.4에서 지우지 않고 바꿔서 남긴다 (1장)
