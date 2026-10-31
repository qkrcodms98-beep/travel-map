import Link from "next/link";
import { formatDongSummary } from "@/lib/formatDongSummary";
import { formatTripDates } from "@/lib/formatTripDates";
import { formatTripLength } from "@/lib/formatTripLength";
import { formatTripNumber } from "@/lib/formatTripNumber";
import type { TripWithNumber } from "@/types/trip";

// 여행 카드: 첫 줄 번호, 둘째 줄 날짜, 셋째 줄 기간·동네. 카드 전체가 여행 상세로 가는 링크 (COMPONENT_SPEC 3-5, 10-5)
interface TripListItemProps {
  trip: TripWithNumber;
  href: string; // 여행 상세 주소
  dongNames: string[]; // 다녀온 동네 이름
}

export function TripListItem({ trip, href, dongNames }: TripListItemProps) {
  // 기간과 동네 중 있는 것만 " · "로 잇는다. 둘 다 없으면 셋째 줄이 없다
  const meta = [formatTripLength(trip.startDate, trip.endDate), formatDongSummary(dongNames)]
    .filter((text) => text !== null)
    .join(" · ");

  return (
    <Link href={href} className="flex items-start justify-between gap-2 rounded-[18px] bg-surface p-4">
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-accent-ink">{formatTripNumber(trip.tripNumber)}</span>
        <span className="block text-lg font-bold tabular-nums">{formatTripDates(trip.startDate, trip.endDate)}</span>
        {meta && <span className="block text-[13px] text-muted">{meta}</span>}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="mt-0.5 shrink-0 text-muted"
        aria-hidden="true"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
