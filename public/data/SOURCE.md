# 지도 데이터 출처

## 원본
- 데이터: admdongkor (행정동 경계)
- 주소: https://github.com/vuski/admdongkor
- 버전: `ver20261001` (2026-10-01 기준 행정구역)
- 원본 파일: `HangJeongDong_ver20261001.geojson` (약 33MB, Git에 올리지 않음)
- admdongkor의 원본 자료: 통계청 SGIS (공공누리 제1유형)

## 라이선스
- CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- 출처를 밝히면 자유롭게 쓰고 고칠 수 있다
- 앱 화면 맨 아래에 "지도 데이터: 통계청 SGIS, admdongkor (CC BY 4.0)"를 표시한다 (COMPONENT_SPEC 3-14)

## 바꾼 내용
이 폴더의 파일은 원본을 아래처럼 바꾼 것이다.
- 구가 있는 일반 시(수원시 장안구 등)의 구를 시 하나로 합쳤다 (DATA_MODEL 3장)
- 점 개수를 줄여(5%) 파일을 가볍게 하고 TopoJSON으로 바꿨다
- 넓이는 줄이기 전 원본 모양으로 계산했다 (㎡)

| 파일 | 내용 |
|---|---|
| `regions.topo.json` | 시·군·구 지도 (230개) |
| `dongs.topo.json` | 읍·면·동 지도 (3,559개) |
| `codes.json` | 시·군·구, 읍·면·동의 코드와 이름 |
| `areas.json` | 시·군·구별 넓이 |

## 다시 만들기
```
npm run data:download
npm run data:build
```
