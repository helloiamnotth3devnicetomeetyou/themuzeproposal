import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerReplace = vi.fn();
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  fetchUpload: vi.fn(),
  setMyReports: vi.fn(),
  setSubmittedId: vi.fn(),
  setError: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: routerReplace }) }));
vi.mock("@/core/auth/auth", () => ({ getUser: mocks.getUser }));
vi.mock("@/core/supabase/client", () => ({ supabase: { from: mocks.from, storage: { from: mocks.storageFrom } } }));
vi.mock("@/core/components/form/CustomSelect", () => ({
  default: ({ ariaLabel, value, onChange, options }: { ariaLabel: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) => (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

import ReportForm from "./ReportForm";
import { LocaleProvider } from "@/core/providers/LocaleContext";

const renderForm = () => render(
  <LocaleProvider initialLocale="en">
    <ReportForm
      artists={[{ id: "artist-1", name: "Artist" }]}
      userEmail="user@example.com"
      setMyReports={mocks.setMyReports}
      setSubmittedId={mocks.setSubmittedId}
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
  await user.type(document.getElementById("postUrl")!, "https://example.com/post");
  fireEvent.change(document.getElementById("postedAt")!, { target: { value: "2026-01-01" } });
  await user.type(document.getElementById("authorName")!, "Author");
  await user.upload(document.getElementById("evidenceFiles")!, new File(["evidence"], "proof.png", { type: "image/png" }));
  await user.click(document.getElementById("reportConfirmation")!);
};

describe("ReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetchUpload);
    mocks.fetchUpload.mockResolvedValue(new Response(
      JSON.stringify({ path: "user-1/file.png" }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    mocks.storageFrom.mockReturnValue({ upload: mocks.upload, remove: mocks.remove });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "protect_reports") return {
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "report-1" }, error: null }) }) }),
      };
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });
  });

  it("blocks a submission with missing required fields", () => {
    const { container } = renderForm();
    fireEvent.pointerDown(container.querySelector("button[type='button']")!, { button: 0 });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mocks.fetchUpload).not.toHaveBeenCalled();
  });

  it("rejects unsupported evidence files", async () => {
    renderForm();
    fireEvent.change(document.getElementById("evidenceFiles")!, { target: { files: [new File(["bad"], "proof.txt", { type: "text/plain" })] } });
    expect(mocks.setError).toHaveBeenCalled();
  });

  it("uploads evidence, creates the report, and attaches the uploaded files", async () => {
    const user = userEvent.setup();
    mocks.getUser.mockResolvedValue({ id: "user-1", email: "user@example.com" });
    const { container } = renderForm();
    await fillValidForm(user);
    await act(async () => { fireEvent.submit(container.querySelector("form")!); });
    expect(mocks.fetchUpload).toHaveBeenCalledTimes(1);
    expect(mocks.fetchUpload).toHaveBeenCalledWith("/api/uploads/protect-evidence", expect.objectContaining({
      method: "POST",
    }));
    expect(mocks.from).toHaveBeenCalledWith("protect_reports");
    expect(mocks.from).toHaveBeenCalledWith("protect_report_attachments");
    expect(mocks.setSubmittedId).toHaveBeenCalledWith("report-1");
  });

  it("redirects an unauthenticated reporter to login", async () => {
    const user = userEvent.setup();
    mocks.getUser.mockResolvedValue(null);
    const { container } = renderForm();
    await fillValidForm(user);
    await act(async () => { fireEvent.submit(container.querySelector("form")!); });
    expect(routerReplace).toHaveBeenCalledWith("/login?redirect=/protect");
  });
});
