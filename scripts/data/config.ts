import path from "node:path";

// 지도 원본 데이터 버전. 바꿀 때는 DATA_MODEL 3장 "지도 데이터를 바꿀 때의 규칙"을 따른다
export const DATA_VERSION = "ver20261001";

export const SOURCE_URL = `https://raw.githubusercontent.com/vuski/admdongkor/master/${DATA_VERSION}/HangJeongDong_${DATA_VERSION}.geojson`;

// 원본은 Git에 올리지 않는 data-raw/에 둔다
export const RAW_DIR = path.join(process.cwd(), "data-raw");
export const RAW_FILE = path.join(RAW_DIR, `HangJeongDong_${DATA_VERSION}.geojson`);

// 변환한 파일은 public/data/에 둔다
export const OUT_DIR = path.join(process.cwd(), "public", "data");

// 이 버전의 행정동 개수 (TRD 6장)
export const EXPECTED_DONG_COUNT = 3559;

// 시·군·구 지도 파일 크기 목표 (TRD 6장)
export const MAX_REGIONS_MAP_BYTES = 1024 * 1024;

// 점을 남기는 비율. 작을수록 파일이 가볍고 모양이 거칠어진다
export const SIMPLIFY_PERCENT = "5%";
