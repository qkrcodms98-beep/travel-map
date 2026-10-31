import { TripListItem } from "@/components/TripListItem";
import { getDongNames } from "@/lib/dongCodes";
import type { RegionCode } from "@/types/region";
import type { TripWithNumber } from "@/types/trip";

// 한 지역의 여행 목록 (COMPONENT_SPEC 3-5)
interface TripListProps {
  trips: TripWithNumber[]; // assignTripNumbers() → sortTripsNewestFirst() 순서로 넣는다
  regionCode: RegionCode;
}

export function TripList({ trips, regionCode }: TripListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripListItem
            trip={trip}
            href={`/regions/${regionCode}/trips/${trip.id}`}
            dongNames={getDongNames(trip.dongCodes)}
          />
        </li>
      ))}
    </ul>
  );
}
