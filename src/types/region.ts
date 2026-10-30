// 시·군·구 코드 5자리 (예: "27720"). 앞자리 0이 사라지지 않게 글자로 다룬다 (DATA_MODEL 4장)
export type RegionCode = string;

// 행정동 코드 10자리 (예: "2772025000")
export type DongCode = string;

// 동네 선택지 하나 (COMPONENT_SPEC 3-9)
export interface DongOption {
  code: DongCode;
  name: string; // 예: "군위읍"
}
