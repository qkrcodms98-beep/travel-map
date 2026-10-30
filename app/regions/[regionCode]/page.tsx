"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import { TripList } from "@/components/TripList";
import { useTripStore } from "@/components/TripStoreProvider";
import { assignTripNumbers } from "@/lib/assignTripNumbers";
import { getRegionName } from "@/lib/regionCodes";
import { sortTripsNewestFirst } from "@/lib/sortTripsNewestFirst";
import type { TripWithNumber } from "@/types/trip";

// 지역 화면: 그 지역의 여행 목록 (COMPONENT_SPEC 3-5-1)
export default function RegionPage() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const router = useRouter();
  const store = useTripStore();
  // 코드 목록에 없으면 undefined (없는 지역)
  const regionName = getRegionName(regionCode);
  // 번호를 매기고 최신순으로 줄 세운 목록. 불러오는 중이면 null
  const [trips, setTrips] = useState<TripWithNumber[] | null>(null);

  useEffect(() => {
    if (!regionName) return;
    store.listTrips(regionCode).then((saved) => {
      // 번호는 오래된 순으로 매기고, 보여 줄 때는 최신순 (맨 위가 가장 큰 번호)
      setTrips(sortTripsNewestFirst(assignTripNumbers(saved)));
    });
  }, [store, regionCode, regionName]);

  if (!regionName) {
    return (
      <main>
        <StatusMessage
          kind="error"
          message="지역을 찾을 수 없어요. 지도에서 다시 골라 주세요."
          actionLabel="지도로 가기"
          onAction={() => router.push("/")}
        />
      </main>
    );
  }

  return (
    <main>
      <PageHeader title={regionName} backHref="/" />
      {trips === null && <StatusMessage kind="loading" message="여행 목록을 불러오는 중이에요…" />}
      {trips?.length === 0 && <StatusMessage kind="empty" message="아직 이 지역의 여행 기록이 없어요." />}
      {trips && trips.length > 0 && <TripList trips={trips} regionCode={regionCode} />}
      <Link href={`/regions/${regionCode}/trips/new`} className="m-4 inline-block rounded border px-3 py-1">
        새 여행 기록
      </Link>
    </main>
  );
}
