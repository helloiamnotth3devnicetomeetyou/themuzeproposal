// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContentWorkbench from "./ContentWorkbench";

describe("ContentWorkbench mobile rail", () => {
  it("opens the compact item rail and returns focus when it closes", () => {
    const { container } = render(
      <ContentWorkbench
        rail={<div>항목 목록</div>}
        railLabel="항목 선택"
        identity={<div>선택한 항목</div>}
        tabs={[{ id: "basic", label: "기본" }]}
        activeTab="basic"
        onTabChange={() => {}}
      >
        <div>편집 영역</div>
      </ContentWorkbench>,
    );

    const trigger = screen.getByRole("button", { name: "항목 선택" });
    fireEvent.click(trigger);
    expect(container.firstElementChild).toHaveClass("is-rail-open");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.firstElementChild).not.toHaveClass("is-rail-open");
    expect(document.activeElement).toBe(trigger);
  });

  it("lets a selected rail item close the mobile rail", () => {
    const { container } = render(
      <ContentWorkbench
        rail={(closeRail) => (
          <button type="button" onClick={closeRail}>
            Select item
          </button>
        )}
        railLabel="Item list"
        identity={<div>Selected item</div>}
        tabs={[{ id: "basic", label: "Basic" }]}
        activeTab="basic"
        onTabChange={() => {}}
      >
        <div>Editor</div>
      </ContentWorkbench>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Item list" }));
    fireEvent.click(screen.getByRole("button", { name: "Select item" }));
    expect(container.firstElementChild).not.toHaveClass("is-rail-open");
  });
});
