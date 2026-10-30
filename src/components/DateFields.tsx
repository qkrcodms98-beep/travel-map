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

export function DateFields({ startDate, endDate, today, onChange }: DateFieldsProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={`${id}-start`}>시작일 (필수)</label>
      {/* 달력에서 오늘 뒤의 날짜는 고를 수 없다 */}
      <input
        id={`${id}-start`}
        type="date"
        max={today}
        value={startDate}
        onChange={(event) => onChange({ startDate: event.target.value, endDate })}
      />
      <label htmlFor={`${id}-end`}>종료일</label>
      {/* 종료일은 미래여도 된다 */}
      <input
        id={`${id}-end`}
        type="date"
        value={endDate}
        onChange={(event) => onChange({ startDate, endDate: event.target.value })}
      />
    </div>
  );
}
