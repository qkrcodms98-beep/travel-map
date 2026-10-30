import { formatTripDates } from "@/lib/formatTripDates";
import type { TripWithNumber } from "@/types/trip";

// 여행 상세 본문: 날짜, 동네(v0.4), 여행일기. 번호는 화면 제목(PageHeader)에 있다 (COMPONENT_SPEC 3-11)
interface TripDetailProps {
  trip: TripWithNumber;
  dongNames: string[]; // getDongNames(trip.dongCodes)
}

export function TripDetail({ trip, dongNames }: TripDetailProps) {
  return (
    <section>
      <p>{formatTripDates(trip.startDate, trip.endDate)}</p>
      <h2>다녀온 동네</h2>
      {dongNames.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {dongNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p>고른 동네가 없어요.</p>
      )}
      <h2>여행일기</h2>
      {/* 줄 바꿈을 그대로 보여 준다 */}
      <p className="whitespace-pre-wrap">{trip.diary || "작성한 여행일기가 없어요."}</p>
    </section>
  );
}
