import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiaryField } from "@/components/DiaryField";

const MAX = 2000;

// 부모처럼 값을 들고 있는 작은 화면. DiaryField는 값을 직접 들지 않고 onChange로만 알린다
function DiaryHolder({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <DiaryField value={value} maxLength={MAX} onChange={setValue} />;
}

const diaryBox = () => screen.getByLabelText<HTMLTextAreaElement>("여행일기");
const CUT_NOTICE = "2,000자까지만 쓸 수 있어요.";

// 칸을 누르고 글자 끝에 커서를 둔 뒤 붙여 넣는다
async function pasteAtEnd(user: ReturnType<typeof userEvent.setup>, text: string) {
  const box = diaryBox();
  await user.click(box);
  box.setSelectionRange(box.value.length, box.value.length);
  await user.paste(text);
}

describe("DiaryField 남은 글자 수", () => {
  it("UI-46 처음에는 '남은 글자 2,000자'와 칸 안 안내 '이 여행에서 있었던 일을 적어 보세요.'가 보인다", () => {
    render(<DiaryHolder />);
    expect(screen.getByText("남은 글자 2,000자")).toBeInTheDocument();
    expect(diaryBox()).toHaveAttribute("placeholder", "이 여행에서 있었던 일을 적어 보세요.");
  });

  it("UI-47 '가😀'를 입력하면 '남은 글자 1,998자'다 (😀를 1자로 센다)", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder />);
    await user.type(diaryBox(), "가😀");
    expect(diaryBox()).toHaveValue("가😀");
    expect(screen.getByText("남은 글자 1,998자")).toBeInTheDocument();
  });

  it("UI-48 1,999자에서 😀를 입력하면 들어가고 '남은 글자 0자'다", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder initial={"가".repeat(1999)} />);
    await user.type(diaryBox(), "😀");
    expect(diaryBox()).toHaveValue("가".repeat(1999) + "😀");
    expect(screen.getByText("남은 글자 0자")).toBeInTheDocument();
  });

  it("UI-49 2,000자에서 한 글자 더 입력하면 들어가지 않고 2,000자 그대로다", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder initial={"가".repeat(2000)} />);
    await user.type(diaryBox(), "나");
    expect(diaryBox()).toHaveValue("가".repeat(2000));
    expect(screen.getByText("남은 글자 0자")).toBeInTheDocument();
  });
});

describe("DiaryField 붙여 넣기", () => {
  it("UI-95 빈 칸에 '가' 2,100자를 붙여 넣으면 2,000자까지만 들어가고 '남은 글자 0자'와 안내가 보인다", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder />);
    await pasteAtEnd(user, "가".repeat(2100));
    expect(diaryBox()).toHaveValue("가".repeat(2000));
    expect(screen.getByText("남은 글자 0자")).toBeInTheDocument();
    expect(screen.getByText(CUT_NOTICE)).toBeInTheDocument();
  });

  it("UI-96 '가' 1,999자에서 '😀😀'를 붙여 넣으면 😀 1개만 들어가고(깨지지 않음) 안내가 보인다", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder initial={"가".repeat(1999)} />);
    await pasteAtEnd(user, "😀😀");
    expect(diaryBox()).toHaveValue("가".repeat(1999) + "😀");
    expect(screen.getByText(CUT_NOTICE)).toBeInTheDocument();
  });

  it("UI-97 2,000자를 넘지 않게 붙여 넣으면 안내가 보이지 않는다", async () => {
    const user = userEvent.setup();
    render(<DiaryHolder />);
    await pasteAtEnd(user, "가".repeat(2000));
    expect(diaryBox()).toHaveValue("가".repeat(2000));
    expect(screen.queryByText(CUT_NOTICE)).not.toBeInTheDocument();
  });
});
