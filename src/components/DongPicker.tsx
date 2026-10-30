import type { DongCode, DongOption } from "@/types/region";

export type { DongOption };

// 다녀온 동네 여러 개 고르기 (COMPONENT_SPEC 3-9)
interface DongPickerProps {
  options: DongOption[]; // 그 지역의 동네 (코드 목록 파일)
  selected: DongCode[];
  error?: string;
  onChange: (selected: DongCode[]) => void;
}

export function DongPicker({ options, selected, error, onChange }: DongPickerProps) {
  // 누르면 넣고, 이미 골랐으면 뺀다 (같은 동네가 두 번 들어가지 않게)
  function toggle(code: DongCode) {
    onChange(selected.includes(code) ? selected.filter((selectedCode) => selectedCode !== code) : [...selected, code]);
  }

  return (
    <fieldset aria-describedby="dong-hint dong-error">
      <legend>다녀온 동네</legend>
      <p id="dong-hint">여러 곳을 고를 수 있어요.</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.code} className="flex items-center gap-1 rounded border px-2 py-1">
            <input type="checkbox" checked={selected.includes(option.code)} onChange={() => toggle(option.code)} />
            {option.name}
          </label>
        ))}
      </div>
      {error && (
        <p id="dong-error" className="text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
