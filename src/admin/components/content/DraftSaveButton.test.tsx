// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DraftSaveButton from "./DraftSaveButton";

const confirm = vi.fn();

vi.mock("@/admin/components/shell/AdminDialogProvider", () => ({
  useAdminConfirm: () => confirm,
}));

describe("DraftSaveButton", () => {
  beforeEach(() => confirm.mockResolvedValue(true));

  it("keeps save state inside the button and shows success for two seconds", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const { rerender } = render(
      <DraftSaveButton
        snapshot='{"title":"before"}'
        draft={{ title: "after" }}
        dirty
        saving={false}
        onSave={onSave}
      />,
    );

    expect(
      screen.getByRole("button", { name: "변경사항 저장 (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "저장하지 않은 변경사항",
    );
    fireEvent.click(screen.getByRole("button", { name: "변경사항 저장 (1)" }));

    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    rerender(
      <DraftSaveButton
        snapshot='{"title":"after"}'
        draft={{ title: "after" }}
        dirty={false}
        saving={false}
        onSave={onSave}
      />,
    );
    expect(screen.getByRole("button", { name: "저장 완료" })).toHaveClass(
      "is-success",
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(
      screen.getByRole("button", { name: "변경사항 저장" }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("uses the same save path for Ctrl/Cmd+S", async () => {
    const onSave = vi.fn();
    render(
      <DraftSaveButton
        snapshot="{}"
        draft={{ title: "changed" }}
        dirty
        saving={false}
        onSave={onSave}
      />,
    );

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    fireEvent.keyDown(window, { key: "s", metaKey: true });

    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });

  it("confirms changes before saving by default", async () => {
    const onSave = vi.fn();
    render(
      <DraftSaveButton
        snapshot="{}"
        draft={{ published: true }}
        dirty
        saving={false}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /변경사항 저장/ }));

    expect(confirm).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });

  it("offers one reset for every unsaved change", async () => {
    vi.useFakeTimers();
    const reset = vi.fn();
    window.addEventListener("admin-draft-reset", reset);
    render(
      <DraftSaveButton
        snapshot="{}"
        draft={{ title: "changed" }}
        dirty
        saving={false}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "되돌리기" }));
    await act(async () => {});

    expect(reset).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ confirmLabel: "모두 되돌리기" }),
    );
    window.removeEventListener("admin-draft-reset", reset);
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
