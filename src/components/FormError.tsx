// 특정 칸에 붙일 수 없는 에러를 폼 위쪽에 보여 준다 (COMPONENT_SPEC 3-10). 빨간 테두리 상자 (10-5)
interface FormErrorProps {
  message?: string; // 없으면 아무것도 안 보여 준다
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border border-danger bg-surface p-4 text-sm text-danger">
      {message}
    </p>
  );
}
