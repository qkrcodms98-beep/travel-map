import Link from "next/link";

// 화면 맨 위: 뒤로 가기 + 제목 (COMPONENT_SPEC 3-4)
interface PageHeaderProps {
  title: string;
  backHref: string; // 뒤로 가기 버튼이 갈 주소
}

export function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 p-4">
      <Link href={backHref} aria-label="뒤로 가기">
        ‹ 뒤로
      </Link>
      <h1 className="text-lg font-bold">{title}</h1>
    </header>
  );
}
