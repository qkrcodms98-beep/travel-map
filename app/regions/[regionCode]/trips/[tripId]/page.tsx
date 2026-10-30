"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DeleteTripButton } from "@/components/DeleteTripButton";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TripDetail } from "@/components/TripDetail";
import { useTripStore } from "@/components/TripStoreProvider";
import { useRegionTrip } from "@/components/useRegionTrip";
import { formatTripNumber } from "@/lib/formatTripNumber";
import { getErrorMessage } from "@/lib/getErrorMessage";

// 여행 상세 화면 (COMPONENT_SPEC 3-11-1)
export default function TripDetailPage() {
  const { regionCode, tripId } = useParams<{ regionCode: string; tripId: string }>();
  const router = useRouter();
  const store = useTripStore();
  const regionHref = `/regions/${regionCode}`;
  // 불러오는 중이면 undefined, 찾지 못하면 null
  const trip = useRegionTrip(regionCode, tripId);

  async function handleDelete() {
    await store.deleteTrip(tripId);
    router.push(regionHref);
  }

  if (trip === undefined) {
    return (
      <main>
        <StatusMessage kind="loading" message="여행을 불러오는 중이에요…" />
      </main>
    );
  }

  if (trip === null) {
    return (
      <main>
        <StatusMessage
          kind="error"
          message={getErrorMessage("TRIP_NOT_FOUND")}
          actionLabel="지역 화면으로"
          onAction={() => router.push(regionHref)}
        />
      </main>
    );
  }

  return (
    <main>
      <PageHeader title={formatTripNumber(trip.tripNumber)} backHref={regionHref} />
      <TripDetail trip={trip} dongNames={[]} />
      <Link href={`${regionHref}/trips/${trip.id}/edit`} className="m-4 inline-block rounded border px-3 py-1">
        수정
      </Link>
      <DeleteTripButton onDelete={handleDelete} />
    </main>
  );
}
