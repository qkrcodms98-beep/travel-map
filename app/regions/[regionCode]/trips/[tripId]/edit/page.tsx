"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TripForm } from "@/components/TripForm";
import { useTripStore } from "@/components/TripStoreProvider";
import { useDongOptions } from "@/components/useDongOptions";
import { useRegionTrip } from "@/components/useRegionTrip";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { toFormValue } from "@/lib/toFormValue";
import type { TripInput } from "@/types/trip";

// 여행 수정 화면 (COMPONENT_SPEC 3-6-2)
export default function EditTripPage() {
  const { regionCode, tripId } = useParams<{ regionCode: string; tripId: string }>();
  const router = useRouter();
  const store = useTripStore();
  const regionHref = `/regions/${regionCode}`;
  const detailHref = `${regionHref}/trips/${tripId}`;
  // 불러오는 중이면 undefined, 찾지 못하면 null
  const trip = useRegionTrip(regionCode, tripId);
  const dongs = useDongOptions(regionCode);

  async function handleSubmit(input: TripInput) {
    await store.updateTrip(tripId, input);
    router.push(detailHref);
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
      <PageHeader title="여행 수정" backHref={detailHref} />
      {/* 종료일 null → "" 로 바꿔 폼에 넣는다 */}
      <TripForm
        mode="edit"
        regionCode={regionCode}
        initialValue={toFormValue(trip)}
        dongs={dongs}
        onSubmit={handleSubmit}
        onCancel={() => router.push(detailHref)}
      />
    </main>
  );
}
