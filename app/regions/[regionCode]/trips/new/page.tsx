"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TripForm } from "@/components/TripForm";
import { useTripStore } from "@/components/TripStoreProvider";
import { useDongOptions } from "@/components/useDongOptions";
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
      <PageHeader title="새 여행 기록" backHref={regionHref} />
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
