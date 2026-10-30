"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// 삭제 버튼. 바로 지우지 않고 확인 창을 연다 (COMPONENT_SPEC 3-12)
interface DeleteTripButtonProps {
  onDelete: () => Promise<void>;
}

export function DeleteTripButton({ onDelete }: DeleteTripButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    // 지우는 중에는 다시 지우지 않는다
    if (deleting) return;
    setDeleting(true);
    await onDelete();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        삭제
      </button>
      <ConfirmDialog
        open={open}
        title="정말 지울까요?"
        message="삭제한 여행은 되돌릴 수 없어요."
        confirmLabel={deleting ? "삭제 중…" : "삭제"}
        cancelLabel="취소"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
