import Link from "next/link";
import { formatTripDates } from "@/lib/formatTripDates";
import { formatTripNumber } from "@/lib/formatTripNumber";
import type { TripWithNumber } from "@/types/trip";

// 여행 한 줄: 첫 줄에 번호, 둘째 줄에 날짜. 누르면 여행 상세로 간다 (COMPONENT_SPEC 3-5)
interface TripListItemProps {
  trip: TripWithNumber;
  href: string; // 여행 상세 주소
}

export function TripListItem({ trip, href }: TripListItemProps) {
  return (
    <Link href={href} className="block p-4">
      <span className="block font-bold">{formatTripNumber(trip.tripNumber)}</span>
      <span className="block text-sm">{formatTripDates(trip.startDate, trip.endDate)}</span>
    </Link>
  );
}
