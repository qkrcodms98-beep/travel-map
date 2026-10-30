// 특정 칸에 붙일 수 없는 에러를 폼 위쪽에 보여 준다 (COMPONENT_SPEC 3-10)
interface FormErrorProps {
  message?: string; // 없으면 아무것도 안 보여 준다
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p role="alert">{message}</p>;
}
