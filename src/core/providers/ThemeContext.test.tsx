import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";

function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  it("provides initial theme", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("toggles theme when toggleTheme is called", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <TestConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("throws error when useTheme is used outside provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider",
    );
    consoleError.mockRestore();
  });
});
