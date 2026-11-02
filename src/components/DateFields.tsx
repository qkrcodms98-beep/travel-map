import { useId } from "react";
import type { DateString } from "@/types/trip";

// 시작일, 종료일 입력 칸 (COMPONENT_SPEC 3-7)
interface DateFieldsProps {
  startDate: DateString | "";
  endDate: DateString | "";
  today: DateString; // getTodayInSeoul()의 결과
  startDateError?: string;
  endDateError?: string;
  onChange: (next: { startDate: DateString | ""; endDate: DateString | "" }) => void;
}

// 칸 이름은 작게, 입력 칸은 높이 48px·모서리 12px, 에러는 빨간 글자 (COMPONENT_SPEC 10-4)
const LABEL_STYLE = "mb-1 block text-[13px] text-muted";
const INPUT_STYLE = "block h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-3";
const ERROR_STYLE = "mt-1 text-[13px] text-danger empty:hidden";

export function DateFields({ startDate, endDate, today, startDateError, endDateError, onChange }: DateFieldsProps) {
  const id = useId();

  return (
    // 카드 "언제 다녀왔어요?" 안에 두 칸을 나란히 (COMPONENT_SPEC 10-5)
    <section className="rounded-3xl bg-surface p-5">
      <h2 className="mb-3 text-base font-bold">언제 다녀왔어요?</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-start`} className={LABEL_STYLE}>
            시작일 (필수)
          </label>
          {/* 달력에서 오늘 뒤의 날짜는 고를 수 없다. 에러 문구를 칸과 함께 읽게 이어 둔다 */}
          <input
            id={`${id}-start`}
            type="date"
            max={today}
            value={startDate}
            aria-describedby={`${id}-start-error`}
            className={INPUT_STYLE}
            onChange={(event) => onChange({ startDate: event.target.value, endDate })}
          />
          <p id={`${id}-start-error`} className={ERROR_STYLE}>
            {startDateError}
          </p>
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-end`} className={LABEL_STYLE}>
            종료일
          </label>
          {/* 종료일은 미래여도 된다 */}
          <input
            id={`${id}-end`}
            type="date"
            value={endDate}
            aria-describedby={`${id}-end-hint ${id}-end-error`}
            className={INPUT_STYLE}
            onChange={(event) => onChange({ startDate, endDate: event.target.value })}
          />
          <p id={`${id}-end-error`} className={ERROR_STYLE}>
            {endDateError}
          </p>
        </div>
      </div>
      <p id={`${id}-end-hint`} className="mt-2 text-[13px] text-muted">
        종료일을 비워 두면 당일치기로 저장돼요.
      </p>
    </section>
  );
}
