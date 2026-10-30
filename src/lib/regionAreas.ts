import areas from "../../public/data/areas.json";
import type { RegionCode } from "@/types/region";

// 넓이 파일(public/data/areas.json)을 읽는 곳을 한 군데로 모은다 (COMPONENT_SPEC 3-3)
// 시·군·구별 넓이(㎡). 지도 완성도 계산에 쓴다
export const REGION_AREAS: Record<RegionCode, number> = areas.areas;
