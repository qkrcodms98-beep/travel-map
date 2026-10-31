// 로딩·빈 목록·에러 문구를 한 모양으로 보여 준다 (COMPONENT_SPEC 3-13)
interface StatusMessageProps {
  kind: "loading" | "empty" | "error";
  message: string;
  actionLabel?: string; // 예: "다시 시도", "새 여행 기록"
  onAction?: () => void;
}

// 불러오는 중은 회색 글자, 빈 목록은 점선 상자, 에러는 흰 카드 + 빨간 글자 (COMPONENT_SPEC 10-5)
const BOX_STYLE = {
  loading: "py-6 text-muted",
  empty: "rounded-[18px] border-[1.5px] border-dashed border-line p-5 text-sm text-muted",
  error: "rounded-3xl bg-surface p-5",
};

export function StatusMessage({ kind, message, actionLabel, onAction }: StatusMessageProps) {
  return (
    // 에러는 화면 읽기 프로그램이 바로 읽어 주게 alert, 나머지는 status
    <div role={kind === "error" ? "alert" : "status"} className={`my-4 text-center ${BOX_STYLE[kind]}`}>
      <p className={kind === "error" ? "text-danger" : undefined}>{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-secondary mt-3">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
