import { TripListItem } from "@/components/TripListItem";
import type { RegionCode } from "@/types/region";
import type { TripWithNumber } from "@/types/trip";

// 한 지역의 여행 목록 (COMPONENT_SPEC 3-5)
interface TripListProps {
  trips: TripWithNumber[]; // assignTripNumbers() → sortTripsNewestFirst() 순서로 넣는다
  regionCode: RegionCode;
}

export function TripList({ trips, regionCode }: TripListProps) {
  return (
    <ul>
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripListItem trip={trip} href={`/regions/${regionCode}/trips/${trip.id}`} />
        </li>
      ))}
    </ul>
  );
}
