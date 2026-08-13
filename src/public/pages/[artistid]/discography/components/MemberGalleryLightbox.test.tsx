// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemberGalleryLightbox } from "./MemberGalleryLightbox";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => (
    <span role="img" aria-label={alt ?? ""} />
  ),
}));

describe("MemberGalleryLightbox", () => {
  it("exposes a modal dialog and keeps focus inside it", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();

    const { unmount } = render(
      <MemberGalleryLightbox
        albumColor="#ff00aa"
        gallery={[
          {
            id: "photo-1",
            imageUrl: "/photo.jpg",
            caption: "Portrait",
            sortOrder: 0,
          },
        ]}
        members={new Map()}
        index={0}
        onIndexChange={vi.fn()}
        onClose={onClose}
      />,
    );

    const dialog = await screen.findByRole("dialog", { name: "Portrait" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Close Lightbox" })).toHaveFocus(),
    );

    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).not.toBe(trigger);

    unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });
});
