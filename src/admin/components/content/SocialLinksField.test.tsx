import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SocialLinksField from "./SocialLinksField";

describe("SocialLinksField", () => {
  it("only asks for a label when the platform is custom", () => {
    const { rerender } = render(
      <SocialLinksField
        value={[
          {
            id: "1",
            platform: "instagram",
            label: "",
            url: "https://instagram.com/themuze",
          },
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("링크 이름")).not.toBeInTheDocument();

    rerender(
      <SocialLinksField
        value={[
          { id: "1", platform: "other", label: "", url: "https://example.com" },
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("링크 이름")).toBeInTheDocument();
  });
});
