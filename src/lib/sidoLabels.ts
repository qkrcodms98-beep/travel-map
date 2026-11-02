import type { MapLabel } from "@/components/MapView";

// 시·도 이름표: 어느 시·도인지(지역 코드 앞 두 자리)와 지도 위 이름 (COMPONENT_SPEC 4장)
export interface SidoLabel extends MapLabel {
  sidoCode: string;
}

// 첫 화면 지도에 늘 보여 줄 시·도 이름 (F-18)
// 위치는 360px 휴대폰의 전국 화면에서 서로 겹치지 않고 그 시·도 안에 들어가게 직접 정했다
// (무게중심으로 계산하면 경기 이름이 서울 위에 떨어지고, 대전·세종 이름이 겹친다)
// 지도 데이터에서 광주·전남은 "전남광주통합특별시"(12) 하나로 합쳐져 있다
export const SIDO_LABELS: SidoLabel[] = [
  { sidoCode: "11", text: "서울", lon: 126.99, lat: 37.56 },
  { sidoCode: "28", text: "인천", lon: 126.45, lat: 37.47 },
  { sidoCode: "41", text: "경기", lon: 127.35, lat: 37.85 },
  { sidoCode: "51", text: "강원", lon: 128.3, lat: 37.75 },
  { sidoCode: "43", text: "충북", lon: 127.75, lat: 36.85 },
  { sidoCode: "36", text: "세종", lon: 127.27, lat: 36.6 },
  { sidoCode: "44", text: "충남", lon: 126.6, lat: 36.4 },
  { sidoCode: "30", text: "대전", lon: 127.4, lat: 36.33 },
  { sidoCode: "47", text: "경북", lon: 128.75, lat: 36.4 },
  { sidoCode: "27", text: "대구", lon: 128.6, lat: 35.87 },
  { sidoCode: "31", text: "울산", lon: 129.25, lat: 35.55 },
  { sidoCode: "26", text: "부산", lon: 129.05, lat: 35.18 },
  { sidoCode: "48", text: "경남", lon: 128.2, lat: 35.3 },
  { sidoCode: "52", text: "전북", lon: 127.15, lat: 35.75 },
  { sidoCode: "12", text: "전남광주", lon: 126.95, lat: 34.9 },
  { sidoCode: "50", text: "제주", lon: 126.55, lat: 33.38 },
];
