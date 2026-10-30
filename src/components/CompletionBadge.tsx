import { formatPercent } from "@/lib/formatPercent";

// 지도 완성도 % (COMPONENT_SPEC 3-3)
interface CompletionBadgeProps {
  percent: number; // calcCompletion()의 결과 (0 ~ 100)
}

export function CompletionBadge({ percent }: CompletionBadgeProps) {
  return (
    <p className="p-3 text-center text-lg font-semibold">{`지도 완성도 ${formatPercent(percent)}`}</p>
  );
}
