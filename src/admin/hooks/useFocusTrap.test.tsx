import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

function Modal() {
  const ref = useFocusTrap<HTMLElement>(true);
  return (
    <section ref={ref}>
      <button>처음</button>
      <button>마지막</button>
    </section>
  );
}

describe("useFocusTrap", () => {
  it("cycles Tab focus inside the active surface", () => {
    render(<Modal />);
    const first = screen.getByRole("button", { name: "처음" });
    const last = screen.getByRole("button", { name: "마지막" });

    expect(document.activeElement).toBe(first);
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
