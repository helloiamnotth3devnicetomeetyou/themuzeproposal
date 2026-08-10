// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ consumeRateLimit: vi.fn(), consumeAttemptRateLimit: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), upload: vi.fn(), remove: vi.fn(), existing: null as Record<string, unknown> | null }));
vi.mock("@/core/http/submission-rate-limit", () => ({ consumeSubmissionRateLimit: mocks.consumeRateLimit, consumeSubmissionAttemptRateLimit: mocks.consumeAttemptRateLimit }));
vi.mock("@/core/uploads/service-storage", () => ({ createServiceRoleClient: () => service }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }) }));

const campaign = { id: "11111111-1111-4111-8111-111111111111", title: "Open", description: "", is_active: true, starts_at: null, ends_at: null };
const fields = [
  { id: "f1", campaign_id: campaign.id, field_key: "email", label_i18n: { ko: "이메일" }, help_text: null, field_type: "short_text", options: [], required: true, max_length: 254, max_file_size_mb: null, accepted_file_types: [], sort_order: 0, is_active: true, is_primary_label: false },
  { id: "f2", campaign_id: campaign.id, field_key: "part", label_i18n: { ko: "부문" }, help_text: null, field_type: "select", options: ["보컬", "댄스"], required: true, max_length: null, max_file_size_mb: null, accepted_file_types: [], sort_order: 1, is_active: true, is_primary_label: true },
  { id: "f3", campaign_id: campaign.id, field_key: "privacy", label_i18n: { ko: "동의" }, help_text: null, field_type: "consent", options: [], required: true, max_length: null, max_file_size_mb: null, accepted_file_types: [], sort_order: 2, is_active: true, is_primary_label: false },
  { id: "f4", campaign_id: campaign.id, field_key: "birth", label_i18n: { ko: "생년월일" }, help_text: null, field_type: "date", options: [], required: false, max_length: null, max_file_size_mb: null, accepted_file_types: [], sort_order: 3, is_active: true, is_primary_label: false },
  { id: "f5", campaign_id: campaign.id, field_key: "portfolio", label_i18n: { ko: "포트폴리오" }, help_text: null, field_type: "file", options: [], required: false, max_length: null, max_file_size_mb: 5, accepted_file_types: ["application/pdf"], sort_order: 4, is_active: true, is_primary_label: false },
];

function chain(result: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), neq: vi.fn(), is: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(), then: (resolve: (value: unknown) => unknown) => resolve(result) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.neq.mockReturnValue(query); query.is.mockReturnValue(query); query.order.mockReturnValue(query); query.maybeSingle.mockResolvedValue(result);
  return query;
}

const service = {
  from: vi.fn((table: string) => {
    if (table === "audition_campaigns") return chain({ data: campaign, error: null });
    if (table === "audition_form_fields") return chain({ data: fields, error: null });
    return { select: vi.fn((columns: string) => columns.includes("answers") ? chain({ data: mocks.existing, error: null }) : chain({ count: 0, error: null })) };
  }),
  rpc: mocks.rpc,
  storage: { from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })) },
};

import { POST } from "./audition-submission-route";

function request(part = "보컬") {
  const form = new FormData();
  form.set("campaignId", campaign.id);
  form.set("answers[email]", "applicant@example.com");
  form.set("answers[part]", part);
  form.set("answers[privacy]", "true");
  return new NextRequest("http://localhost/api/audition/submit", { method: "POST", headers: { origin: "http://localhost" }, body: form });
}

describe("POST /api/audition/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUBMISSION_RATE_LIMIT_SECRET = "test-secret";
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "applicant@example.com", email_confirmed_at: "2026-08-01T00:00:00.000Z" } }, error: null });
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: true, remaining: 4, retryAfter: 0 });
    mocks.consumeAttemptRateLimit.mockResolvedValue({ error: false, allowed: true, remaining: 29, retryAfter: 0 });
    mocks.rpc.mockResolvedValue({ data: [{ id: "submission-1", created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" }], error: null });
    mocks.existing = null;
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
  });

  it("builds the snapshot server-side and ties the service-role write to the signed-in user", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.anything(), "audition_submission", "user-1");
    expect(mocks.rpc).toHaveBeenCalledWith("save_audition_submission", expect.objectContaining({ p_campaign_id: campaign.id, p_user_id: "user-1", p_answers: expect.objectContaining({ email: "applicant@example.com", part: "보컬", privacy: "true" }), p_form_snapshot: fields, p_applicant_email_hash: expect.any(String) }));
  });

  it("updates only the signed-in user's existing submission while the campaign is open", async () => {
    mocks.existing = { id: "submission-1", campaign_id: campaign.id, user_id: "user-1", answers: {}, status: "pending", reviewer_notes: null, reviewed_by: null, reviewed_at: null, created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" };
    const original = request("댄스");
    const form = await original.formData();
    form.set("submissionId", "submission-1");
    const response = await POST(new NextRequest(original.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("save_audition_submission", expect.objectContaining({ p_user_id: "user-1", p_campaign_id: campaign.id, p_answers: expect.objectContaining({ part: "댄스" }) }));
  });

  it("does not let applicants edit a reviewed submission", async () => {
    mocks.existing = { id: "submission-1", campaign_id: campaign.id, user_id: "user-1", answers: {}, status: "accepted", reviewer_notes: "keep", reviewed_by: "admin-1", reviewed_at: "2026-08-02T00:00:00.000Z", created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" };

    const original = request();
    const form = await original.formData();
    form.set("submissionId", "submission-1");
    const response = await POST(new NextRequest(original.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ code: "SUBMISSION_NOT_EDITABLE" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("removes replacement uploads when an edit loses the version race", async () => {
    mocks.existing = { id: "submission-1", campaign_id: campaign.id, user_id: "user-1", answers: {}, status: "pending", reviewer_notes: null, reviewed_by: null, reviewed_at: null, created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" };
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    const original = request();
    const form = await original.formData();
    form.set("submissionId", "submission-1");
    form.set("answers[portfolio]", new File(["%PDF-1.7\ncontent"], "portfolio.pdf", { type: "application/pdf" }));

    const response = await POST(new NextRequest(original.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ code: "SUBMISSION_CONFLICT" });
    expect(mocks.remove).toHaveBeenCalledWith([expect.stringMatching(/\.pdf$/)]);
  });

  it("rejects an option not present in the active server definition", async () => {
    const response = await POST(request("연기"));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_OPTION" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects an application email that does not belong to the authenticated account", async () => {
    const forged = request();
    const form = await forged.formData();
    form.set("answers[email]", "victim@example.com");
    const response = await POST(new NextRequest(forged.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ code: "EMAIL_ACCOUNT_MISMATCH" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a calendar date that JavaScript would otherwise normalize", async () => {
    const invalid = request();
    const form = await invalid.formData();
    form.set("answers[birth]", "2026-02-31");
    const response = await POST(new NextRequest(invalid.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_DATE" });
  });

  it("removes uploaded private files when the database write fails", async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { code: "XX000" } });
    const invalid = request();
    const form = await invalid.formData();
    form.set("answers[portfolio]", new File(["%PDF-1.7\ncontent"], "portfolio.pdf", { type: "application/pdf" }));
    const response = await POST(new NextRequest(invalid.url, { method: "POST", headers: { origin: "http://localhost" }, body: form }));
    expect(response.status).toBe(503);
    expect(mocks.upload).toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith([expect.stringMatching(/\.pdf$/)]);
  });

  it("rate-limits a validated application before storing it", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ error: false, allowed: false, remaining: 0, retryAfter: 60 });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
