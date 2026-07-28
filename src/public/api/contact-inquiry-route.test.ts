// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
  createSessionClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSessionClient,
}));
vi.mock("@/core/uploads/service-storage", () => ({
  createServiceRoleClient: mocks.createServiceClient,
}));

import { POST } from "./contact-inquiry-route";

function validForm(attachment?: File) {
  const formData = new FormData();
  formData.set("category", "business");
  formData.set("inquiryType", "brand_collaboration");
  formData.set("companyName", "Company");
  formData.set("contactName", "Contact");
  formData.set("phone", "010-0000-0000");
  formData.set("email", "contact@example.com");
  formData.set("message", "Partnership proposal");
  formData.set("privacyConsent", "true");
  if (attachment) formData.set("attachment", attachment);
  return formData;
}

function request(formData: FormData) {
  return new NextRequest("http://localhost/api/contact-inquiries", {
    method: "POST",
    headers: { origin: "http://localhost" },
    body: formData,
  });
}

describe("POST /api/contact-inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.createSessionClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createServiceClient.mockReturnValue({
      storage: {
        from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })),
      },
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it("stores the received byte length and canonical MIME type", async () => {
    const file = new File(["%PDF-1.7\ncontent"], "proposal.pdf", { type: "text/html" });
    const response = await POST(request(validForm(file)));

    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.pdf$/),
      file,
      expect.objectContaining({ contentType: "application/pdf" }),
    );
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      attachment_name: "proposal.pdf",
      attachment_size: file.size,
    }));
  });

  it("rejects a declared PDF whose bytes are HTML", async () => {
    const file = new File(["<script>alert(1)</script>"], "proposal.pdf", {
      type: "application/pdf",
    });
    const response = await POST(request(validForm(file)));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_FILE_TYPE" });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
