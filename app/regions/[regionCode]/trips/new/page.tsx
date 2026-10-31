"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TripForm } from "@/components/TripForm";
import { useTripStore } from "@/components/TripStoreProvider";
import { useDongOptions } from "@/components/useDongOptions";
import { getRegionName } from "@/lib/regionCodes";
import type { TripInput } from "@/types/trip";

// 새 여행 기록 화면 (COMPONENT_SPEC 3-6-1)
export default function NewTripPage() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const router = useRouter();
  const store = useTripStore();
  const dongs = useDongOptions(regionCode);
  const regionHref = `/regions/${regionCode}`;

  async function handleSubmit(input: TripInput) {
    await store.createTrip({ regionCode, ...input });
    router.push(regionHref);
  }

  return (
    <main>
      {/* 부제는 지역 이름만. 번호는 시작일로 정해져서 아직 알 수 없다 (COMPONENT_SPEC 3-4) */}
      <PageHeader title="새 여행 기록" backHref={regionHref} subtitle={getRegionName(regionCode)} />
      <TripForm
        mode="create"
        regionCode={regionCode}
        dongs={dongs}
        onSubmit={handleSubmit}
        onCancel={() => router.push(regionHref)}
      />
    </main>
  );
}
