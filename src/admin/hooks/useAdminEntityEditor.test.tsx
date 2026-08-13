// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdminEntityEditor } from "./useAdminEntityEditor";

type Draft = {
  id: string;
  title: string;
};

describe("useAdminEntityEditor", () => {
  it("tracks draft patches and commits the current state", () => {
    const { result } = renderHook(() =>
      useAdminEntityEditor<Draft>({
        initialDraft: { id: "one", title: "Before" },
      }),
    );

    expect(result.current.dirty).toBe(false);

    act(() => result.current.patchDraft({ title: "After" }));
    expect(result.current.draft?.title).toBe("After");
    expect(result.current.dirty).toBe(true);

    act(() => result.current.commitDraft());
    expect(result.current.dirty).toBe(false);
  });

  it("resets the draft and clears an existing error", () => {
    const { result } = renderHook(() =>
      useAdminEntityEditor<Draft>({ initialDraft: null }),
    );

    act(() => result.current.setError("failed"));
    act(() => result.current.resetDraft({ id: "two", title: "Ready" }));

    expect(result.current.draft).toEqual({ id: "two", title: "Ready" });
    expect(result.current.error).toBe("");
    expect(result.current.dirty).toBe(false);
  });

  it("wraps asynchronous operations with busy and error state", async () => {
    const { result } = renderHook(() =>
      useAdminEntityEditor<Draft>({ initialDraft: null }),
    );

    await act(async () => {
      await result.current.runSave(async () => {
        throw new Error("save failed");
      });
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe("save failed");
  });
});
