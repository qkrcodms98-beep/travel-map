import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteTripButton } from "@/components/DeleteTripButton";

// 저장소 대신 onDelete가 불렸는지 본다 (여행 상세 화면에서는 이 자리에서 deleteTrip을 부른다)
const onDelete = jest.fn<Promise<void>, []>();

beforeEach(() => {
  onDelete.mockReset().mockResolvedValue(undefined);
});

// 화면의 "삭제" 버튼을 눌러 확인 창을 연다
async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  render(<DeleteTripButton onDelete={onDelete} />);
  await user.click(screen.getByRole("button", { name: "삭제" }));
  return screen.getByRole("dialog", { name: "정말 지울까요?" });
}

describe("DeleteTripButton과 ConfirmDialog", () => {
  it("UI-76 '삭제'를 누르면 확인 창이 열리고, 아직 지우지 않는다", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user);

    expect(within(dialog).getByText("삭제한 여행은 되돌릴 수 없어요.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "삭제" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("UI-77 확인 창에서 '취소'를 누르면 창이 닫히고 지우지 않는다", async () => {
    const user = userEvent.setup();
    const dialog = await openDialog(user);

    await user.click(within(dialog).getByRole("button", { name: "취소" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("UI-78 확인 창에서 '삭제'를 누르면 한 번만 지우고, 기다리는 동안 버튼이 '삭제 중…'이다", async () => {
    const user = userEvent.setup();
    // 끝나지 않는 삭제
    onDelete.mockReturnValue(new Promise<void>(() => {}));
    const dialog = await openDialog(user);

    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    const deleting = within(dialog).getByRole("button", { name: "삭제 중…" });
    // 기다리는 중에 한 번 더 눌러도 또 지우지 않는다
    await user.click(deleting);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
