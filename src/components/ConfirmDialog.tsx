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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      className="fixed inset-0 grid place-items-center bg-black/40"
    >
      <div className="rounded bg-white p-4">
        <h2 id={`${id}-title`} className="font-bold">
          {title}
        </h2>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
