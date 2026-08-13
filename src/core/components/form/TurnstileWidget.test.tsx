// @vitest-environment jsdom
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "./TurnstileWidget";

vi.mock("@/core/providers/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));
vi.mock("@/core/config/public-env", () => ({
  getTurnstileSiteKey: () => "site-key",
}));

const scriptSelector = "script[src^='https://challenges.cloudflare.com/turnstile']";

afterEach(() => {
  delete window.turnstile;
  document.querySelectorAll(scriptSelector).forEach((script) => script.remove());
});

describe("TurnstileWidget", () => {
  it("allows a later mount to retry after a script load failure", async () => {
    const ref = { current: null } as React.RefObject<TurnstileWidgetHandle | null>;
    const first = render(
      <TurnstileWidget ref={ref} onToken={vi.fn()} size="invisible" />,
    );
    const failedScript = document.querySelector<HTMLScriptElement>(scriptSelector);
    expect(failedScript).not.toBeNull();

    act(() => failedScript?.onerror?.(new Event("error")));
    await waitFor(() => expect(document.querySelector(scriptSelector)).toBeNull());
    first.unmount();

    render(<TurnstileWidget ref={ref} onToken={vi.fn()} size="invisible" />);

    await waitFor(() =>
      expect(document.querySelector(scriptSelector)).not.toBeNull(),
    );
    const retryScript = document.querySelector<HTMLScriptElement>(scriptSelector);
    act(() => retryScript?.onerror?.(new Event("error")));
    await waitFor(() => expect(document.querySelector(scriptSelector)).toBeNull());
  });

  it("queues an execute request until the widget script is ready", async () => {
    const execute = vi.fn();
    const api = {
      render: vi.fn(() => "widget-1"),
      execute,
      reset: vi.fn(),
      remove: vi.fn(),
    };
    const ref = { current: null } as React.RefObject<TurnstileWidgetHandle | null>;

    render(
      <TurnstileWidget ref={ref} onToken={vi.fn()} size="invisible" />,
    );
    const script = document.querySelector<HTMLScriptElement>(scriptSelector);
    expect(script).not.toBeNull();

    act(() => ref.current?.execute());
    expect(execute).not.toHaveBeenCalled();

    window.turnstile = api;
    act(() => script?.onload?.(new Event("load")));

    await waitFor(() => expect(execute).toHaveBeenCalledWith("widget-1"));
  });
});
