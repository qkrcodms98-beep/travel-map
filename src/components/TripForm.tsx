"use client";

import { useState } from "react";
import { DateFields } from "@/components/DateFields";
import { DiaryField } from "@/components/DiaryField";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { getTodayInSeoul } from "@/lib/getTodayInSeoul";
import { REGION_CODES } from "@/lib/regionCodes";
import { toTripInput } from "@/lib/toTripInput";
import { DIARY_MAX_CHARS, isRealDate, validateNewTrip } from "@/lib/tripRules";
import type { RegionCode } from "@/types/region";
import type { TripFormValue, TripInput } from "@/types/trip";

const EMPTY_VALUE: TripFormValue = { startDate: "", endDate: "", diary: "", dongCodes: [] };

// 칸마다 보여 줄 에러 문구. form은 칸에 붙일 수 없는 에러
interface FormErrors {
  startDate?: string;
  endDate?: string;
  form?: string;
}

// 에러 코드 → 보여 줄 자리 (COMPONENT_SPEC 3-6, 5장)
function toFormErrors(code: string, input: TripInput): FormErrors {
  const message = getErrorMessage(code);
  switch (code) {
    case "START_DATE_REQUIRED":
    case "START_DATE_IN_FUTURE":
      return { startDate: message };
    case "END_DATE_BEFORE_START":
      return { endDate: message };
    case "INVALID_DATE":
      // 검사는 코드 하나만 주므로, 어느 칸이 틀렸는지는 날짜마다 다시 본다
      return {
        startDate: isRealDate(input.startDate) ? undefined : message,
        endDate: input.endDate === null || isRealDate(input.endDate) ? undefined : message,
      };
    default:
      return { form: message };
  }
}

// 새 여행 기록과 여행 수정에 같이 쓰는 입력 폼 (COMPONENT_SPEC 3-6)
interface TripFormProps {
  mode: "create" | "edit";
  regionCode: RegionCode;
  initialValue?: TripFormValue; // 수정할 때 지금 값
  onSubmit: (input: TripInput) => Promise<void>;
  onCancel: () => void;
}

export function TripForm({ regionCode, initialValue, onSubmit, onCancel }: TripFormProps) {
  const [value, setValue] = useState<TripFormValue>(initialValue ?? EMPTY_VALUE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // 저장 중에는 다시 저장하지 않는다
    if (saving) return;

    // 종료일 "" → null로 바꾼 뒤 검사한다
    const input = toTripInput(value);
    const result = validateNewTrip({ regionCode, ...input }, { now: new Date(), regionCodes: REGION_CODES });
    if (!result.success) {
      setErrors(toFormErrors(result.code, input));
      return;
    }

    setErrors({});
    setSaving(true);
    const { startDate, endDate, diary, dongCodes } = result.data;
    await onSubmit({ startDate, endDate, diary, dongCodes });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormError message={errors.form} />
      <DateFields
        startDate={value.startDate}
        endDate={value.endDate}
        today={getTodayInSeoul(new Date())}
        startDateError={errors.startDate}
        endDateError={errors.endDate}
        onChange={(dates) => setValue({ ...value, ...dates })}
      />
      <DiaryField value={value.diary} maxLength={DIARY_MAX_CHARS} onChange={(diary) => setValue({ ...value, diary })} />
      <button type="submit" disabled={saving}>
        {saving ? "저장 중…" : "저장"}
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  );
}
