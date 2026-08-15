// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ContactList from "./ContactList";
import type { ContactInquiry } from "./useContactInquiries";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));

vi.mock("@/core/components/form/CustomSelect", () => ({
  default: ({ ariaLabel }: { ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} />
  ),
}));

const inquiry: ContactInquiry = {
  id: "inquiry-1",
  user_id: null,
  category: "general",
  inquiry_type: "general",
  company_name: null,
  contact_name: "김뮤즈",
  phone: null,
  email: "muze@example.com",
  message: "문의 내용을 확인해 주세요.",
  attachment_path: null,
  attachment_name: null,
  attachment_size: null,
  status: "pending",
  admin_note: null,
  created_at: "2026-08-15T01:00:00.000Z",
  updated_at: "2026-08-15T01:00:00.000Z",
  answered_at: null,
  answered_by: null,
  urgency: null,
  urgency_rank: null,
  is_likely_spam: false,
  ai_reasoning: null,
  ai_classified_at: null,
  read_at: null,
  read_by: null,
};

describe("ContactList", () => {
  it("keeps the inbox usable while showing errors and refreshing", async () => {
    const user = userEvent.setup();
    const fetchInquiries = vi.fn().mockResolvedValue(undefined);
    const onClearError = vi.fn();

    render(
      <ContactList
        category="general"
        categoryCounts={{ general: 1, business: 0 }}
        error="목록을 불러오지 못했습니다."
        listError=""
        fetchInquiries={fetchInquiries}
        filter="all"
        urgencyFilter="all"
        spamFilter="all"
        pendingAiCount={1}
        classifying={false}
        refreshing
        inquiries={[inquiry]}
        page={1}
        query=""
        total={1}
        onCategoryChange={vi.fn()}
        onClearError={onClearError}
        onFilterChange={vi.fn()}
        onUrgencyFilterChange={vi.fn()}
        onSpamFilterChange={vi.fn()}
        onClassifyPending={vi.fn()}
        onOpenInquiry={vi.fn()}
        onPageChange={vi.fn()}
        onQueryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("목록을 불러오지 못했습니다.");
    expect(
      screen.getByRole("button", { name: "김뮤즈 문의 열기" }).className,
    ).toMatch(/unread/);
    expect(screen.getByRole("button", { name: /일반 문의/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("문의 메일함").closest("section")?.querySelector('[aria-busy="true"]')).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onClearError).toHaveBeenCalledOnce();
    expect(fetchInquiries).toHaveBeenCalledOnce();
  });
});
