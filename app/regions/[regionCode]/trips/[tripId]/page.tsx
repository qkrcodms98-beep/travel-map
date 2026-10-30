"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DeleteTripButton } from "@/components/DeleteTripButton";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TripDetail } from "@/components/TripDetail";
import { useTripStore } from "@/components/TripStoreProvider";
import { useRegionTrip } from "@/components/useRegionTrip";
import { getDongNames } from "@/lib/dongCodes";
import { formatTripNumber } from "@/lib/formatTripNumber";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { errorCodeOf } from "@/lib/tripStoreError";

// 여행 상세 화면 (COMPONENT_SPEC 3-11-1)
export default function TripDetailPage() {
  const { regionCode, tripId } = useParams<{ regionCode: string; tripId: string }>();
  const router = useRouter();
  const store = useTripStore();
  const regionHref = `/regions/${regionCode}`;
  // 불러오는 중이면 undefined, 찾지 못하면 null
  const trip = useRegionTrip(regionCode, tripId);
  // 삭제가 실패했을 때의 에러 코드 (v0.2~)
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleteError(null);
    try {
      await store.deleteTrip(tripId);
      router.push(regionHref);
    } catch (error) {
      setDeleteError(errorCodeOf(error));
    }
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
      <TripDetail trip={trip} dongNames={getDongNames(trip.dongCodes)} />
      <Link href={`${regionHref}/trips/${trip.id}/edit`} className="m-4 inline-block rounded border px-3 py-1">
        수정
      </Link>
      <DeleteTripButton onDelete={handleDelete} />
      {deleteError && (
        <StatusMessage
          kind="error"
          message={getErrorMessage(deleteError)}
          actionLabel="다시 시도"
          onAction={handleDelete}
        />
      )}
    </main>
  );
}
