// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

afterEach(() => vi.useRealTimers());

describe("DeleteConfirmDialog", () => {
  it("confirms only after holding for 1.5 seconds", () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmDialog
        title="삭제"
        description="설명"
        confirmValue="대상"
        valueLabel="이름"
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "대상" },
    });
    const button = screen.getByRole("button", { name: /1.5초/ });

    fireEvent.pointerDown(button, { button: 0 });
    vi.advanceTimersByTime(1499);
    expect(onConfirm).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
