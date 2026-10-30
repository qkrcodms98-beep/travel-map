"use client";

import { useCallback, useEffect, useState } from "react";
import type { DongListState } from "@/components/TripForm";
import type { DongOption, RegionCode } from "@/types/region";

// 그 지역의 동네 목록을 불러와 TripForm의 dongs 모양으로 돌려준다 (COMPONENT_SPEC 3-6-1)
// 동네 목록 코드(src/lib/dongCodes.ts)는 따로 떼어 불러온다(import()). 그래서 잠깐 불러오는 중이 있고, 실패할 수도 있다
export function useDongOptions(regionCode: RegionCode): DongListState {
  const [options, setOptions] = useState<DongOption[] | "loading" | "error">("loading");

  const load = useCallback(() => {
    let cancelled = false;
    setOptions("loading");
    import("@/lib/dongCodes")
      .then(({ getDongOptions }) => {
        if (!cancelled) setOptions(getDongOptions(regionCode));
      })
      .catch(() => {
        if (!cancelled) setOptions("error");
      });
    // 화면이 사라진 뒤에 도착한 결과는 버린다
    return () => {
      cancelled = true;
    };
  }, [regionCode]);

  useEffect(() => load(), [load]);

  if (options === "loading") return { status: "loading" };
  if (options === "error") return { status: "error", onRetry: load };
  return { status: "ready", options };
}
