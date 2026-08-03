import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import LoadingIndicator from "./LoadingIndicator";

describe("LoadingIndicator", () => {
  it("renders with role status", () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders custom label when provided", () => {
    render(<LoadingIndicator label="불러오는 중..." />);
    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("applies custom size style", () => {
    const { container } = render(<LoadingIndicator size={80} />);
    const logoContainer = container.querySelector(".muze-loading-logo-container");
    expect(logoContainer).toHaveStyle({ width: "80px" });
  });

  it("accepts string size", () => {
    const { container } = render(<LoadingIndicator size="4rem" />);
    const logoContainer = container.querySelector(".muze-loading-logo-container");
    expect(logoContainer).toHaveStyle({ width: "4rem" });
  });

  it("applies extra className", () => {
    render(<LoadingIndicator className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });
});
