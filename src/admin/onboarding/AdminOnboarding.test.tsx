import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/hero",
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/core/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) =>
      table === "admin_onboarding_progress"
        ? {
            select: async () => ({ data: [], error: null }),
            upsert: async () => ({ error: null }),
          }
        : {
            select: () => ({ limit: async () => ({ data: [], error: null }) }),
          },
    ),
  },
}));

import AdminOnboarding from "./AdminOnboarding";

describe("AdminOnboarding mobile guide", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(window.matchMedia).mockImplementation(() => ({
      matches: true,
      media: "(max-width: 700px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: class {
        observe() {}
        disconnect() {}
      },
    });
  });

  it("collapses the mobile sheet without trapping the admin screen", async () => {
    const { container } = render(
      <>
        <button type="button" data-tour-id="draft-reset">
          Reset
        </button>
        <AdminOnboarding
          userId="user-1"
          role="editor"
          artists={[]}
          isCollapsed={false}
          canNavigate={() => true}
        />
      </>,
    );
    const target = container.querySelector<HTMLElement>(
      "[data-tour-id='draft-reset']",
    )!;
    target.getBoundingClientRect = () => ({
      x: 20,
      y: 80,
      top: 80,
      left: 20,
      right: 180,
      bottom: 124,
      width: 160,
      height: 44,
      toJSON: () => ({}),
    });
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: () => [target],
    });

    await vi.waitFor(() =>
      expect(
        container.querySelector(".admin-guide-launcher"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(".admin-guide-launcher")!,
    );
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-welcome-actions button",
      )!,
    );
    await vi.waitFor(() =>
      expect(
        document.querySelector(".admin-guide-chapter-intro .is-next"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-chapter-intro .is-next",
      )!,
    );

    await vi.waitFor(() =>
      expect(
        document.querySelector(".admin-guide-popover"),
      ).toBeInTheDocument(),
    );
    const sheet = document.querySelector<HTMLElement>(".admin-guide-popover")!;
    const toggle = sheet.querySelector<HTMLButtonElement>(
      ".admin-guide-mobile-bar button",
    )!;
    expect(sheet).toHaveAttribute("aria-modal", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(sheet.querySelector(".admin-guide-badges")).not.toBeInTheDocument();
    expect(
      sheet.querySelector(".admin-guide-explore-hint"),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(sheet).toHaveClass("is-mobile-collapsed");
    expect(sheet).toHaveAttribute("aria-modal", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle.querySelector("strong")).toHaveTextContent(
      "강조된 ‘되돌리기’ 위치를 확인하세요.",
    );
  });

  it("offers resume and restart before reopening a paused guide", async () => {
    localStorage.setItem(
      "admin-guide-paused:user-1",
      JSON.stringify({ chapterId: "1", index: 2, mode: "chapter" }),
    );
    const { container } = render(
      <AdminOnboarding
        userId="user-1"
        role="editor"
        artists={[]}
        isCollapsed={false}
        canNavigate={() => true}
      />,
    );

    await vi.waitFor(() =>
      expect(
        container.querySelector(".admin-guide-launcher"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(".admin-guide-launcher")!,
    );
    await vi.waitFor(() =>
      expect(
        document.querySelector(".admin-guide-chapter-intro"),
      ).toBeInTheDocument(),
    );

    const labels = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        ".admin-guide-chapter-intro footer button",
      ),
      (button) => button.textContent,
    );
    expect(labels).toContain("처음부터 보기");
    expect(labels).toContain("이어보기");
  });

  it("keeps the launcher expanded in an expanded sidebar after reopening", async () => {
    localStorage.setItem("admin-guide-seen:user-1", "true");
    const { container } = render(
      <AdminOnboarding
        userId="user-1"
        role="editor"
        artists={[]}
        isCollapsed={false}
        canNavigate={() => true}
      />,
    );

    await vi.waitFor(() =>
      expect(
        container.querySelector(".admin-guide-launcher"),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector(".admin-guide-launcher")).not.toHaveClass(
      "is-collapsed",
    );
  });

  it("prefers an enabled repeated target and accepts practice on any matching target", async () => {
    const { container } = render(
      <>
        <button type="button" data-tour-id="draft-reset">
          Reset
        </button>
        <button type="button" data-tour-id="hero-add" disabled>
          Added
        </button>
        <button type="button" data-tour-id="hero-add">
          Add
        </button>
        <article data-tour-id="hero-reorder">
          <button type="button">First slide</button>
        </article>
        <article data-tour-id="hero-reorder">
          <button type="button">Second slide</button>
        </article>
        <AdminOnboarding
          userId="user-1"
          role="editor"
          artists={[]}
          isCollapsed={false}
          canNavigate={() => true}
        />
      </>,
    );
    const reset = container.querySelector<HTMLElement>(
      "[data-tour-id='draft-reset']",
    )!;
    const [added, add] = Array.from(
      container.querySelectorAll<HTMLElement>("[data-tour-id='hero-add']"),
    );
    const [firstSlide, secondSlide] = Array.from(
      container.querySelectorAll<HTMLElement>("[data-tour-id='hero-reorder']"),
    );
    const place = (element: HTMLElement, top: number) => {
      element.getBoundingClientRect = () => ({
        x: 20,
        y: top,
        top,
        left: 20,
        right: 180,
        bottom: top + 44,
        width: 160,
        height: 44,
        toJSON: () => ({}),
      });
    };
    [reset, added, add, firstSlide, secondSlide].forEach((element, index) =>
      place(element, 80 + index * 60),
    );
    Object.defineProperty(document, "elementsFromPoint", {
      configurable: true,
      value: (_x: number, y: number) =>
        [[reset], [added], [add], [firstSlide], [secondSlide]][
          Math.max(0, Math.min(4, Math.floor((y - 58) / 60)))
        ],
    });

    await vi.waitFor(() =>
      expect(
        container.querySelector(".admin-guide-launcher"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(".admin-guide-launcher")!,
    );
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-welcome-actions button",
      )!,
    );
    await vi.waitFor(() =>
      expect(
        document.querySelector(".admin-guide-chapter-intro .is-next"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-chapter-intro .is-next",
      )!,
    );
    await vi.waitFor(() =>
      expect(
        document.querySelector(".admin-guide-popover .is-next"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      )!,
    );

    await vi.waitFor(() =>
      expect(document.querySelector(".admin-guide-task")).toHaveTextContent(
        "메인에 추가",
      ),
    );
    expect(add).toHaveClass("admin-guide-target");
    expect(added).not.toHaveClass("admin-guide-target");
    expect(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      ),
    ).toBeDisabled();
    fireEvent.click(add);
    await vi.waitFor(() =>
      expect(document.querySelector(".admin-guide-task")).toHaveClass(
        "is-complete",
      ),
    );
    expect(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      ),
    ).toBeEnabled();

    fireEvent.click(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      )!,
    );
    await vi.waitFor(() =>
      expect(document.querySelector(".admin-guide-task")).toHaveTextContent(
        "슬라이드 카드 한 장",
      ),
    );
    expect(firstSlide).toHaveClass("admin-guide-target");
    expect(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      ),
    ).toBeDisabled();
    fireEvent.pointerUp(secondSlide.querySelector("button")!);
    await vi.waitFor(() =>
      expect(document.querySelector(".admin-guide-task")).toHaveClass(
        "is-complete",
      ),
    );
    expect(
      document.querySelector<HTMLButtonElement>(
        ".admin-guide-popover .is-next",
      ),
    ).toBeEnabled();
  });
});
