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
    // 카드 "다녀온 동네": 제목 왼쪽, 안내 오른쪽, 그 아래 동네 칩 (COMPONENT_SPEC 10-5)
    <fieldset aria-describedby="dong-hint dong-error" className="rounded-3xl bg-surface p-5">
      <legend className="float-left text-base font-bold">다녀온 동네</legend>
      <p id="dong-hint" className="float-right pt-0.5 text-[13px] text-muted">
        여러 곳을 고를 수 있어요.
      </p>
      <div className="clear-both flex flex-wrap gap-2 pt-3">
        {options.map((option) => {
          const checked = selected.includes(option.code);
          return (
            // 체크 상자는 그대로 두고(화면 읽기용) 눈에는 칩만 보인다. 고르면 초록 바탕 + ✓
            <label
              key={option.code}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border px-3.5 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                checked ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.code)}
                className="sr-only"
              />
              {checked && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              )}
              {option.name}
            </label>
          );
        })}
      </div>
      {error && (
        <p id="dong-error" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
