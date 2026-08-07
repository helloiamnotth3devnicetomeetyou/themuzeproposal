import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDraftBackup } from "./useDraftBackup";

describe("useDraftBackup", () => {
  beforeEach(() => localStorage.clear());

  it("restores the backup and announces it through the admin toast", async () => {
    localStorage.setItem("draft", JSON.stringify({ draft: { title: "복구본" }, updatedAt: 1 }));
    const restore = vi.fn();
    const onToast = vi.fn();
    window.addEventListener("admin-toast", onToast);
    const { result } = renderHook(() => useDraftBackup({ key: "draft", draft: { title: "서버본" }, snapshot: JSON.stringify({ title: "서버본" }), dirty: false, restore }));

    await waitFor(() => expect(result.current.recovery).not.toBeNull());
    act(() => result.current.restoreBackup());

    expect(restore).toHaveBeenCalledWith({ title: "복구본" });
    expect((onToast.mock.calls[0][0] as CustomEvent<string>).detail).toBe("임시 작업을 복구했습니다.");
    window.removeEventListener("admin-toast", onToast);
  });

  it("does not offer sandbox drafts for recovery", async () => {
    localStorage.setItem("admin-guide-sandbox", "true");
    localStorage.setItem("draft", JSON.stringify({ draft: { title: "연습본" }, updatedAt: 1 }));
    const { result } = renderHook(() => useDraftBackup({ key: "draft", draft: { title: "서버본" }, snapshot: JSON.stringify({ title: "서버본" }), dirty: false, restore: vi.fn() }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.recovery).toBeNull();
  });
});
