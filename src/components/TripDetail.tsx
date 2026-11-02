import { formatTripDates } from "@/lib/formatTripDates";
import { formatTripLength } from "@/lib/formatTripLength";
import type { TripWithNumber } from "@/types/trip";

// 여행 상세 본문: 날짜, 기간, 동네(v0.4), 여행일기. 번호는 화면 제목(PageHeader)에 있다 (COMPONENT_SPEC 3-11)
interface TripDetailProps {
  trip: TripWithNumber;
  dongNames: string[]; // getDongNames(trip.dongCodes)
}

// 카드 안의 작은 제목 ("다녀온 동네", "여행일기")
const SMALL_HEADING = "text-[13px] font-semibold text-muted";

export function TripDetail({ trip, dongNames }: TripDetailProps) {
  const length = formatTripLength(trip.startDate, trip.endDate);

  return (
    // 흰 카드 하나: 날짜 → 기간 → 동네 → 구분선 → 여행일기 (COMPONENT_SPEC 10-5)
    <section className="rounded-3xl bg-surface p-5">
      <p className="text-[26px] leading-tight font-bold tracking-tight tabular-nums">
        {formatTripDates(trip.startDate, trip.endDate)}
      </p>
      {length && <p className="mt-1 text-muted">{length}</p>}

      <h2 className={`mt-5 mb-2 ${SMALL_HEADING}`}>다녀온 동네</h2>
      {dongNames.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {dongNames.map((name) => (
            <li
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-ink"
            >
              {/* 핀 그림 */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
              </svg>
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">고른 동네가 없어요.</p>
      )}

      <hr className="my-5 border-line" />
      <h2 className={`mb-2 ${SMALL_HEADING}`}>여행일기</h2>
      {/* 줄 바꿈을 그대로 보여 주고, 길어도 접지 않는다. 일기 글꼴(고운바탕) */}
      {trip.diary ? (
        <p className="font-diary text-[17px] leading-[1.8] break-words whitespace-pre-wrap">{trip.diary}</p>
      ) : (
        <p className="text-sm text-muted">작성한 여행일기가 없어요.</p>
      )}
    </section>
  );
}
