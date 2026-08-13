// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAdminEntityEditor } from "./useAdminEntityEditor";

type Draft = {
  id: string;
  title: string;
};

describe("useAdminEntityEditor", () => {
  beforeEach(() => localStorage.clear());

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
    expect(result.current.error).toBe("요청을 처리하지 못했습니다.");
  });

  it("clears a previous entity recovery when its storage key changes", async () => {
    localStorage.setItem(
      "entity-one",
      JSON.stringify({
        draft: { id: "one", title: "Recovered" },
        updatedAt: 1,
      }),
    );
    const { result, rerender } = renderHook(
      ({ storageKey }) =>
        useAdminEntityEditor<Draft>({
          initialDraft: { id: "one", title: "Current" },
          storageKey,
        }),
      { initialProps: { storageKey: "entity-one" } },
    );

    await waitFor(() => expect(result.current.recovery).not.toBeNull());

    rerender({ storageKey: "entity-two" });

    await waitFor(() => expect(result.current.recovery).toBeNull());
  });
});
