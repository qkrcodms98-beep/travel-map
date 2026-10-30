import { useId, useState } from "react";
import { countDiaryChars } from "@/lib/countDiaryChars";
import { cutToMaxChars } from "@/lib/cutToMaxChars";

// 여행일기 입력 칸과 남은 글자 수 (COMPONENT_SPEC 3-8)
interface DiaryFieldProps {
  value: string;
  maxLength: number; // 2000
  error?: string;
  onChange: (value: string) => void;
}

// 천 단위에 쉼표 (2000 → "2,000")
const formatCount = (count: number) => count.toLocaleString("ko-KR");

export function DiaryField({ value, maxLength, onChange }: DiaryFieldProps) {
  const id = useId();
  // 넣은 글이 잘렸으면 true
  const [wasCut, setWasCut] = useState(false);
  const remaining = maxLength - countDiaryChars(value);

  function handleChange(next: string) {
    // 브라우저 maxLength는 이모지를 2자로 세서 쓰지 않고, 같은 글자 세기 함수로 자른다
    const cut = cutToMaxChars(next, maxLength);
    setWasCut(cut !== next);
    onChange(cut);
  }

  return (
    <div>
      <label htmlFor={id}>여행일기</label>
      <textarea
        id={id}
        value={value}
        placeholder="이 여행에서 있었던 일을 적어 보세요."
        onChange={(event) => handleChange(event.target.value)}
      />
      <p>남은 글자 {formatCount(remaining)}자</p>
      {wasCut && <p>{formatCount(maxLength)}자까지만 쓸 수 있어요.</p>}
    </div>
  );
}
