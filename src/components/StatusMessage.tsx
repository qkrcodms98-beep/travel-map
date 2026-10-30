// 로딩·빈 목록·에러 문구를 한 모양으로 보여 준다 (COMPONENT_SPEC 3-13)
interface StatusMessageProps {
  kind: "loading" | "empty" | "error";
  message: string;
  actionLabel?: string; // 예: "다시 시도", "새 여행 기록"
  onAction?: () => void;
}

export function StatusMessage({ kind, message, actionLabel, onAction }: StatusMessageProps) {
  return (
    // 에러는 화면 읽기 프로그램이 바로 읽어 주게 alert, 나머지는 status
    <div role={kind === "error" ? "alert" : "status"} className="p-4 text-center">
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-2 rounded border px-3 py-1">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
