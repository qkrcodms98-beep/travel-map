"use client";

import { useState } from "react";
import { DateFields } from "@/components/DateFields";
import { DiaryField } from "@/components/DiaryField";
import { DongPicker } from "@/components/DongPicker";
import { FormError } from "@/components/FormError";
import { StatusMessage } from "@/components/StatusMessage";
import { DONG_REGIONS } from "@/lib/dongCodes";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { errorCodeOf } from "@/lib/tripStoreError";
import { getTodayInSeoul } from "@/lib/getTodayInSeoul";
import { REGION_CODES } from "@/lib/regionCodes";
import { toTripInput } from "@/lib/toTripInput";
import { DIARY_MAX_CHARS, isRealDate, validateNewTrip, validateTripUpdate } from "@/lib/tripRules";
import type { DongOption, RegionCode } from "@/types/region";
import type { TripFormValue, TripInput } from "@/types/trip";

const EMPTY_VALUE: TripFormValue = { startDate: "", endDate: "", diary: "", dongCodes: [] };

// 칸마다 보여 줄 에러 문구. form은 칸에 붙일 수 없는 에러
interface FormErrors {
  startDate?: string;
  endDate?: string;
  dongCodes?: string;
  form?: string;
}

// 동네 목록 상태 (v0.4). 페이지가 useDongOptions()로 만들어 넘긴다 (COMPONENT_SPEC 3-6)
export type DongListState =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | { status: "ready"; options: DongOption[] };

// 에러 코드 → 보여 줄 자리 (COMPONENT_SPEC 3-6, 5장). 동네 칸이 없으면 동네 에러는 폼 위쪽에
function toFormErrors(code: string, input: TripInput, hasDongPicker: boolean): FormErrors {
  const message = getErrorMessage(code);
  switch (code) {
    case "START_DATE_REQUIRED":
    case "START_DATE_IN_FUTURE":
      return { startDate: message };
    case "END_DATE_BEFORE_START":
      return { endDate: message };
    case "INVALID_DONG_CODE":
    case "DUPLICATE_DONG_CODE":
      return hasDongPicker ? { dongCodes: message } : { form: message };
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
  dongs?: DongListState; // v0.4부터. 빼면 동네 칸이 없다
  onSubmit: (input: TripInput) => Promise<void>;
  onCancel: () => void;
}

export function TripForm({ mode, regionCode, initialValue, dongs, onSubmit, onCancel }: TripFormProps) {
  const [value, setValue] = useState<TripFormValue>(initialValue ?? EMPTY_VALUE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const hasDongPicker = dongs?.status === "ready";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // 저장 중에는 다시 저장하지 않는다
    if (saving) return;

    // 종료일 "" → null로 바꾼 뒤 검사한다
    const input = toTripInput(value);
    // 새 여행은 지역까지, 수정은 지역 없이 검사한다 (수정에서는 지역을 바꿀 수 없다)
    const now = new Date();
    const result =
      mode === "create"
        ? validateNewTrip({ regionCode, ...input }, { now, regionCodes: REGION_CODES, dongRegions: DONG_REGIONS })
        : validateTripUpdate(input, { now, dongs: { regionCode, dongRegions: DONG_REGIONS } });
    if (!result.success) {
      setErrors(toFormErrors(result.code, input, hasDongPicker));
      return;
    }

    setErrors({});
    setSaving(true);
    const { startDate, endDate, diary, dongCodes } = result.data;
    try {
      await onSubmit({ startDate, endDate, diary, dongCodes });
    } catch (error) {
      // 서버가 막았거나 서버에 닿지 못함 (v0.2~). 에러를 보여 주고 다시 저장할 수 있게 한다
      setErrors(toFormErrors(errorCodeOf(error), input, hasDongPicker));
      setSaving(false);
    }
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
      {dongs?.status === "loading" && <StatusMessage kind="loading" message="동네 목록을 불러오는 중이에요…" />}
      {dongs?.status === "error" && (
        <StatusMessage
          kind="error"
          message="동네 목록을 불러오지 못했어요."
          actionLabel="다시 시도"
          onAction={dongs.onRetry}
        />
      )}
      {dongs?.status === "ready" && (
        <DongPicker
          options={dongs.options}
          selected={value.dongCodes}
          error={errors.dongCodes}
          onChange={(dongCodes) => setValue({ ...value, dongCodes })}
        />
      )}
      <button type="submit" disabled={saving}>
        {saving ? "저장 중…" : "저장"}
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  );
}
