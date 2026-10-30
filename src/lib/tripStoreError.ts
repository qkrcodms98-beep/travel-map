// 저장소 함수가 실패하면 던지는 에러. code는 API_SPEC 2장의 에러 코드
// 서버에 닿지 못하면 "NETWORK_ERROR" (화면에서만 쓰는 코드, COMPONENT_SPEC 5장)
export class TripStoreError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = "TripStoreError";
    this.code = code;
  }
}
