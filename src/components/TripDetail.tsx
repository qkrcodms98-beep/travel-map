import { formatTripDates } from "@/lib/formatTripDates";
import type { TripWithNumber } from "@/types/trip";

// 여행 상세 본문: 날짜, 동네(v0.4), 여행일기. 번호는 화면 제목(PageHeader)에 있다 (COMPONENT_SPEC 3-11)
interface TripDetailProps {
  trip: TripWithNumber;
  dongNames: string[]; // v0.3까지는 []
}

export function TripDetail({ trip }: TripDetailProps) {
  return (
    <section>
      <p>{formatTripDates(trip.startDate, trip.endDate)}</p>
      <h2>여행일기</h2>
      {/* 줄 바꿈을 그대로 보여 준다 */}
      <p className="whitespace-pre-wrap">{trip.diary || "작성한 여행일기가 없어요."}</p>
    </section>
  );
}
