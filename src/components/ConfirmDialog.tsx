import { useId } from "react";

// 한 번 더 확인받는 창 (COMPONENT_SPEC 3-12)
interface ConfirmDialogProps {
  open: boolean;
  title: string; // "정말 지울까요?"
  message: string; // "삭제한 여행은 되돌릴 수 없어요."
  confirmLabel: string; // "삭제"
  cancelLabel: string; // "취소"
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId();
  if (!open) return null;

  return (
    // 뒤 화면을 어둡게. 휴대폰에서는 아래에서 올라오는 카드, 넓은 화면에서는 가운데 카드 (COMPONENT_SPEC 10-5)
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="w-full max-w-[640px] rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:mx-4 sm:max-w-sm sm:rounded-3xl sm:pb-5">
        <h2 id={`${id}-title`} className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-1 text-muted">{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
