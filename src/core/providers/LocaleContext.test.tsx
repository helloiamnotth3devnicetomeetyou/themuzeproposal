// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "./LocaleContext";

function Consumer() {
  const { locale, setLocale } = useLocale();
  return (
    <>
      <p data-testid="copy">{locale === "ko" ? "가나다" : "ABC"}</p>
      <p data-testid="unchanged">same</p>
      <button type="button" onClick={() => setLocale("en")}>
        switch
      </button>
    </>
  );
}

describe("LocaleProvider", () => {
  it("updates translated text without replacing React-owned nodes", () => {
    vi.useFakeTimers();
    render(
      <LocaleProvider initialLocale="ko">
        <Consumer />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByText("switch"));
    vi.advanceTimersByTime(0);

    expect(screen.getByTestId("copy")).toHaveTextContent("ABC");
    expect(screen.getByTestId("copy")).not.toContainHTML("span");
    expect(screen.getByTestId("unchanged")).toHaveTextContent("same");
    vi.useRealTimers();
  });
});
