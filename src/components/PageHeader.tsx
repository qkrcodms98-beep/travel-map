import Link from "next/link";

// 화면 맨 위: 뒤로 가기 + 제목 + 부제 (COMPONENT_SPEC 3-4, 10-5)
interface PageHeaderProps {
  title: string;
  backHref: string; // 뒤로 가기 버튼이 갈 주소
  subtitle?: string; // 제목 아래 작은 글씨 (v0.5)
}

export function PageHeader({ title, backHref, subtitle }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 py-4">
      {/* 44px 동그란 버튼. 그림은 화면 읽기에서 빼고 이름은 "뒤로 가기" */}
      <Link
        href={backHref}
        aria-label="뒤로 가기"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <div className="min-w-0">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
