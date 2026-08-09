import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DraftSaveButton from "./DraftSaveButton";

const confirm = vi.fn();

vi.mock("@/admin/components/shell/AdminDialogProvider", () => ({ useAdminConfirm: () => confirm }));

describe("DraftSaveButton", () => {
  beforeEach(() => confirm.mockResolvedValue(true));

  it("shows saved on the button only for five seconds after a successful save", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const { rerender } = render(<DraftSaveButton snapshot='{"title":"before"}' draft={{ title: "after" }} dirty saving={false} onSave={onSave} />);

    expect(screen.getByRole("button", { name: /변경사항 저장/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /변경사항 저장/ }));

    expect(confirm).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    rerender(<DraftSaveButton snapshot='{"title":"after"}' draft={{ title: "after" }} dirty={false} saving={false} onSave={onSave} />);
    expect(screen.getByRole("button", { name: "저장됨" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("button", { name: /변경사항 저장/ })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("keeps confirmation available for high-impact changes", async () => {
    const onSave = vi.fn();
    render(<DraftSaveButton snapshot="{}" draft={{ published: true }} dirty saving={false} requireConfirmation onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /변경사항 저장/ }));

    expect(confirm).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });
});
