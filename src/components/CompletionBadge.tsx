import { formatPercent } from "@/lib/formatPercent";

// 지도 완성도 % 카드 + 진행 막대 (COMPONENT_SPEC 3-3, 10-5)
interface CompletionBadgeProps {
  percent: number; // calcCompletion()의 결과 (0 ~ 100)
}

export function CompletionBadge({ percent }: CompletionBadgeProps) {
  return (
    <div className="rounded-3xl bg-surface px-4 py-3">
      {/* 글자는 한 요소 안에 "지도 완성도 12.3%". 줄을 바꿔 첫 줄(이름)만 작게, 둘째 줄(숫자)은 크게 */}
      <p className="text-xl font-bold whitespace-pre-line tabular-nums first-line:text-[13px] first-line:font-normal first-line:text-muted">
        {`지도 완성도\n${formatPercent(percent)}`}
      </p>
      <div
        role="progressbar"
        aria-label="지도 완성도"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
