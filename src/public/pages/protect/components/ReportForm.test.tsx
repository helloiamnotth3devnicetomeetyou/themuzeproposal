// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerReplace = vi.fn();
const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  setMyReports: vi.fn(),
  setSubmittedId: vi.fn(),
  setError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));
vi.mock("@/core/components/form/CustomSelect", () => ({
  default: ({
    ariaLabel,
    value,
    onChange,
    options,
  }: {
    ariaLabel: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock("@/core/components/form/TurnstileWidget", () => ({
  default: forwardRef(function TurnstileWidgetStub(
    { onToken }: { onToken: (token: string | null) => void },
    ref: React.Ref<{ execute: () => void; reset: () => void }>,
  ) {
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;
    useEffect(() => {
      onTokenRef.current("test-turnstile-token");
    }, []);
    useImperativeHandle(ref, () => ({
      execute: () => onTokenRef.current("test-turnstile-token"),
      reset: () => onTokenRef.current(null),
    }));
    return <div data-testid="turnstile-stub" />;
  }),
}));

import ReportForm from "./ReportForm";
import { getLocalDateInputValue } from "./ReportFormFields";
import { LocaleProvider } from "@/core/providers/LocaleContext";

const renderForm = () =>
  render(
    <LocaleProvider initialLocale="en">
      <ReportForm
        artists={[{ id: "artist-1", name: "Artist" }]}
        userEmail="user@example.com"
        setMyReports={mocks.setMyReports}
        setSubmittedId={mocks.setSubmittedId}
        setRemaining={vi.fn()}
        setError={mocks.setError}
        error=""
      />
    </LocaleProvider>,
  );

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(screen.getAllByRole("combobox")[0], "artist-1");
  await user.selectOptions(screen.getAllByRole("combobox")[1], "defamation");
  await user.type(document.getElementById("title")!, "Report title");
  await user.type(document.getElementById("content")!, "Report details");
  await user.selectOptions(screen.getAllByRole("combobox")[2], "instagram");
  await user.type(
    document.getElementById("postUrl")!,
    "https://example.com/post",
  );
  fireEvent.change(document.getElementById("postedAt")!, {
    target: { value: "2026-01-01" },
  });
  await user.type(document.getElementById("authorName")!, "Author");
  await user.upload(
    document.getElementById("evidenceFiles")!,
    new File(["evidence"], "proof.png", { type: "image/png" }),
  );
  await user.click(document.getElementById("reportConfirmation")!);
};

describe("ReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "report-1",
          createdAt: "2026-01-01T00:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });

  it("blocks a submission with missing required fields", () => {
    const { container } = renderForm();
    fireEvent.pointerDown(container.querySelector("button[type='button']")!, {
      button: 0,
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported evidence files", async () => {
    renderForm();
    fireEvent.change(document.getElementById("evidenceFiles")!, {
      target: {
        files: [new File(["bad"], "proof.txt", { type: "text/plain" })],
      },
    });
    expect(mocks.setError).toHaveBeenCalled();
  });

  it("uses the local calendar date as the posted-at maximum", async () => {
    renderForm();

    await waitFor(() =>
      expect(document.getElementById("postedAt")).toHaveAttribute(
        "max",
        getLocalDateInputValue(new Date()),
      ),
    );
  });

  it("submits the report and evidence through the server route", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();
    await fillValidForm(user);
    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/protect-reports",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(mocks.setSubmittedId).toHaveBeenCalledWith("report-1");
  });

  it("redirects an unauthenticated reporter to login", async () => {
    const user = userEvent.setup();
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const { container } = renderForm();
    await fillValidForm(user);
    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });
    expect(routerReplace).toHaveBeenCalledWith("/login?redirect=/protect");
  });

  it("does not update a tab after its pending submission unmounts", async () => {
    let resolve!: (response: Response) => void;
    mocks.fetch.mockReturnValueOnce(
      new Promise<Response>((next) => {
        resolve = next;
      }),
    );
    const user = userEvent.setup();
    const { container, unmount } = renderForm();
    await fillValidForm(user);
    fireEvent.submit(container.querySelector("form")!);
    unmount();
    resolve(
      new Response(JSON.stringify({ id: "report-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await Promise.resolve();
    expect(mocks.setSubmittedId).not.toHaveBeenCalled();
  });
});
