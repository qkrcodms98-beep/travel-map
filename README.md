# 나만의 여행 지도

우리나라 지도에 내 여행을 기록하고, 여행을 다닐수록 지도가 위성사진처럼 채워지는 나만의 여행 앱

> 학습용 개인 프로젝트입니다. 로그인(v2.0)이 생기기 전까지는 배포 주소를 아는 사람이면 누구나 기록을 볼 수 있으므로, 연습용 기록만 넣습니다.

## 개발 배경

기존 여행 기록 앱을 쓰면서 불편했던 점에서 출발했습니다.

- 같은 지역을 두 번 가면 기록이 애매해진다
- 사진이 뭉개지고, 한 장밖에 못 넣는 경우가 많다
- UI가 마음에 들지 않는다

그래서 기록의 단위를 **"지역"이 아니라 "여행(Trip)"** 으로 잡았습니다. 한 지역에 여행이 여러 개 쌓이고, "경주 첫 번째 여행", "경주 두 번째 여행"처럼 따로 남습니다.

## 주요 기능

| 버전 | 기능 |
|---|---|
| v0.1 | 전국 시·군·구 지도 보기, 확대·이동 (휴대폰 두 손가락 확대 포함) |
| v0.1 | 지역을 누르면 그 지역의 여행 목록 ("첫 번째 여행"처럼 번호, 최신순) |
| v0.1 | 여행 추가·수정·삭제 (시작일, 종료일, 여행일기 최대 2,000자) |
| v0.1 | 지도 색칠: 안 가 본 곳 흰색, 1번 연두색, 2번 이상 진한 초록 |
| v0.2 | FastAPI 백엔드 연결 (서버 메모리 저장) |
| v0.3 | Neon Postgres에 저장. 서버를 다시 켜도 기록이 남음 |
| v0.4 | 동네(읍·면·동) 선택: 한 여행에 동네를 여러 개 고를 수 있음 |
| v0.4 | 지형 무늬: 2번 이상 간 지역을 실제 산맥 위치를 바탕으로 그린 위성 지형 무늬로 칠함 |
| v0.4 | 지도 완성도 %: 가 본 시·군·구 넓이 ÷ 전체 땅 넓이 |

### 기록 규칙

- 한 여행은 한 지역(시·군·구)에만 속합니다. "부산 → 경주" 여행은 부산 여행, 경주 여행으로 따로 기록합니다
- 구가 있는 일반 시(수원시 장안구 등)는 시 하나로 합칩니다. 특별시·광역시의 구는 따로 봅니다
- 여행 번호는 시작일 순서로 매기고, 날짜를 고치거나 여행을 지우면 자동으로 다시 매깁니다

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프런트엔드 | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS |
| 지도 | d3.js, topojson-client |
| 백엔드 | Python 3.12, FastAPI, Pydantic v2 |
| DB | PostgreSQL (Neon), SQLAlchemy 2.0, Alembic, psycopg |
| 테스트 | Jest + React Testing Library, pytest + FastAPI TestClient |
| 패키지 관리 | npm, uv |

## 실행 방법

### 준비물

- Node.js 22
- Python 3.12와 [uv](https://docs.astral.sh/uv/)
- Neon Postgres DB (실제용, 테스트용 2개)

### 환경 변수

실제 값은 Git에 올리지 않습니다 (`.gitignore`가 `.env*`를 막습니다).

| 이름 | 파일 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `.env.local` (프로젝트 루트) | 백엔드 주소. 개발할 때는 `http://localhost:8000` |
| `DATABASE_URL` | `backend/.env` | Neon DB 주소. `postgresql+psycopg://`로 시작 |
| `DATABASE_URL_TEST` | `backend/.env` | 테스트용 DB 주소 (DB 테스트에서만 사용) |
| `CORS_ORIGINS` | `backend/.env` | 백엔드를 부를 수 있는 화면 주소. 쉼표로 여러 개. 기본값 `http://localhost:3000` |

`NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 그대로 보이므로 백엔드 주소만 넣습니다.

### 백엔드 (`backend/` 폴더에서)

```bash
uv sync                                                       # 패키지 설치
uv run python -m alembic upgrade head                         # DB 표 만들기
uv run python -m uvicorn app.main:app --reload --port 8000    # 서버 (http://localhost:8000)
```

### 프런트엔드 (프로젝트 루트에서)

```bash
npm install
cp .env.example .env.local    # 그다음 NEXT_PUBLIC_API_URL 값을 확인
npm run dev                   # http://localhost:3000
```

### 테스트

```bash
npm test                                   # 프런트엔드 (루트에서)
uv run python -m pytest                    # 백엔드 (backend/에서)
uv run python -m pytest -m db              # 백엔드 DB 테스트 (테스트용 DB 필요)
```

> `uvicorn`, `pytest`, `alembic`을 `python -m` 형태로 실행하는 이유: 개발한 PC에서 `Scripts` 폴더의 `.exe` 실행이 막혀 있어서입니다. 다른 환경에서도 그대로 동작합니다.

### 지도 데이터 다시 만들기 (선택)

`public/data/`에 변환된 파일이 이미 들어 있어서 보통은 필요 없습니다.

```bash
npm run data:download
npm run data:build
```

## 개발 방식

- **문서 먼저:** [docs/IDEA.md](docs/IDEA.md)를 기준으로 PRD → TRD → DATA_MODEL → API_SPEC → COMPONENT_SPEC → TEST_CASES 순서로 명세를 먼저 쓰고 만들었습니다. 명세에 없는 것을 정해야 하면 문서에 먼저 적고 진행합니다
- **TDD:** 테스트 ID(예: `LOGIC-30`, `VAL-43`, `UI-60`)를 TEST_CASES에 정해 두고 Red → Green → Refactor 순서로 만듭니다. 테스트를 지우거나 건너뛰지 않고, 실패하면 테스트가 아니라 구현을 고칩니다
- **계산은 함수로 분리:** 여행 번호, 지도 색칠 단계, 지도 완성도, 지형 무늬는 `src/lib/`의 순수 함수로 두고 따로 테스트합니다
- **같은 규칙, 양쪽 검사:** 입력 규칙은 화면(Zod)과 백엔드(Pydantic + 파이썬)가 따로 검사하고, 같은 테스트 표로 양쪽 결과를 맞춥니다
- **버전별 태그:** 한 번에 한 버전의 기능만 만들고, 버전이 끝나면 `v0.1`, `v0.2`처럼 태그를 붙입니다

| 태그 | 내용 |
|---|---|
| `v0.1` | 화면만 (브라우저 메모리) |
| `v0.2` | API 연결 (서버 메모리) |
| `v0.3` | DB 저장 (Neon) |
| `v0.4` | 동네 선택, 지형 무늬, 지도 완성도 |

## 앞으로 할 것

| 버전 | 내용 |
|---|---|
| v0.5 | 디자인 다듬기 |
| v1.0 | 배포, 휴대폰 홈 화면 설치 |
| v1.1 | 지도 채우기 애니메이션 (버튼을 누르면 0%부터 여행 날짜 순서대로 지도가 칠해짐) |
| v1.2 | 사진 여러 장 (원본 화질) |
| v1.3 | 그날의 소리 (여행지에서 녹음한 소리 남기기) |
| v2.0 | 로그인 |
| v2.1 | 친구 지도 구경하기, 같이 간 여행 공유하기 |

## 폴더 구조

```
app/            페이지 (Next.js App Router)
src/components/ 화면 컴포넌트
src/lib/        계산 함수, 입력 규칙
src/types/      공유 타입
backend/        FastAPI 백엔드 (API, 입력 검사, 저장소, DB)
public/data/    지도 경계 데이터
docs/           명세 문서
scripts/        지도 데이터 받기·변환 스크립트
tests/          테스트용 가짜 데이터
```

## 지도 데이터 출처

- 행정구역 경계: [admdongkor](https://github.com/vuski/admdongkor) `ver20261001` (2026-10-01 기준). 원본 자료는 통계청 SGIS입니다
- 라이선스: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 구가 있는 일반 시를 시 하나로 합치고, 점 개수를 줄여 TopoJSON으로 바꿔 사용합니다. 자세한 내용은 [public/data/SOURCE.md](public/data/SOURCE.md)에 있습니다
- 앱 화면 맨 아래에도 "지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)"를 표시합니다
