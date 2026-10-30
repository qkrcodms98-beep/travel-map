import type { DongCode, RegionCode } from "@/types/region";

// 날짜 "YYYY-MM-DD" (예: "2026-10-28"). Date 대신 글자로 두면 입력 칸·JSON과 그대로 맞고 시간대 때문에 하루가 밀리지 않는다
export type DateString = string;

// 저장된 여행 한 개 (DATA_MODEL 4장)
export interface Trip {
  id: string;
  regionCode: RegionCode;
  startDate: DateString;
  endDate: DateString | null; // null이면 당일치기
  diary: string; // 안 쓰면 ""
  dongCodes: DongCode[]; // v0.3까지는 []
  createdAt: string; // 기록한 시각 (ISO 형식). 수정해도 그대로
  updatedAt: string; // 마지막으로 수정한 시각 (ISO 형식)
}

// 새 여행을 만들 때 보내는 값 (id, createdAt, updatedAt은 저장소가 정한다)
export type NewTrip = Omit<Trip, "id" | "createdAt" | "updatedAt">;

// 화면에 보여 줄 때만 쓰는 모양. tripNumber는 계산해서 붙이고 저장하지 않는다
export interface TripWithNumber extends Trip {
  tripNumber: number; // 1이면 "첫 번째 여행"
}

// 폼 안의 값. 입력 칸은 null을 담을 수 없어서 날짜를 비우면 "" (COMPONENT_SPEC 3-6)
export interface TripFormValue {
  startDate: DateString | ""; // 아직 안 골랐으면 ""
  endDate: DateString | ""; // 비우면 당일치기
  diary: string;
  dongCodes: DongCode[];
}

// 저장할 때 보내는 값. NewTrip에서 지역 코드를 뺀 모양 (수정할 때 지역은 못 바꾼다)
export type TripInput = Omit<NewTrip, "regionCode">;

// 여행 기록을 읽고 쓰는 함수 모음 (COMPONENT_SPEC 3-1). 메모리 저장소와 API 저장소가 같은 모양을 지킨다
export interface TripStore {
  listTrips(regionCode?: RegionCode): Promise<Trip[]>;
  createTrip(input: NewTrip): Promise<Trip>;
  updateTrip(id: string, input: TripInput): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
}
