import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin", useRouter: () => ({ push: vi.fn() }) }));

import SidebarSearch from "./SidebarSearch";

describe("SidebarSearch", () => {
  it("reopens results when typing after Escape", () => {
    render(<SidebarSearch artists={[]} content={{ albums: [], members: [], schedules: [], notices: [] }} canNavigate={() => true} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "dashboard" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
