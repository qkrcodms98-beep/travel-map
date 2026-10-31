"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [loadFailed, setLoadFailed] = useState(false);

  const loadTrips = useCallback(() => {
    if (!regionName) return;
    setLoadFailed(false);
    store
      .listTrips(regionCode)
      .then((saved) => {
        // 번호는 오래된 순으로 매기고, 보여 줄 때는 최신순 (맨 위가 가장 큰 번호)
        setTrips(sortTripsNewestFirst(assignTripNumbers(saved)));
      })
      .catch(() => setLoadFailed(true));
  }, [store, regionCode, regionName]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

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
      {/* 부제는 여행이 1개 이상일 때만 (COMPONENT_SPEC 3-4) */}
      <PageHeader title={regionName} backHref="/" subtitle={trips?.length ? `여행 ${trips.length}번` : undefined} />
      {/* 섹션 줄: 왼쪽 "여행 기록 · 최신순", 오른쪽 "+ 새 여행 기록" (COMPONENT_SPEC 10-5) */}
      <div className="mt-2 mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">
          여행 기록 <span className="text-xs font-medium text-muted">최신순</span>
        </h2>
        <Link
          href={`/regions/${regionCode}/trips/new`}
          className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 font-semibold text-accent"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 여행 기록
        </Link>
      </div>
      {trips === null && !loadFailed && <StatusMessage kind="loading" message="여행 목록을 불러오는 중이에요…" />}
      {loadFailed && (
        <StatusMessage kind="error" message="여행 목록을 불러오지 못했어요." actionLabel="다시 시도" onAction={loadTrips} />
      )}
      {trips?.length === 0 && <StatusMessage kind="empty" message="아직 이 지역의 여행 기록이 없어요." />}
      {trips && trips.length > 0 && <TripList trips={trips} regionCode={regionCode} />}
    </main>
  );
}
