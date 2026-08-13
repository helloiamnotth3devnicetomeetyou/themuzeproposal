import { NextResponse, type NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { deleteObjects, uploadObject } from "@/core/storage/r2";
import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  boundedFileName,
  extensionMatches,
  validateFileSignature,
} from "@/core/uploads/file-signature";
import { createServiceRoleClient } from "@/core/uploads/service-storage";
import {
  consumeSubmissionAttemptRateLimit,
  consumeSubmissionRateLimit,
} from "@/core/http/submission-rate-limit";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { verifyTurnstileToken } from "@/core/http/turnstile";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const GENERAL_TYPES = new Set([
  "account",
  "notice_event",
  "goods_md",
  "site_error",
  "other",
]);
const BUSINESS_TYPES = new Set([
  "brand_collaboration",
  "advertising_sponsorship",
  "md_licensing",
  "performance_event",
  "other_business",
]);

function errorResponse(code: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400);

  const preParseAttempt = await consumeSubmissionAttemptRateLimit(
    request,
    "contact_inquiry",
    `preparse:${clientIp(request) ?? "unknown"}`,
  );
  if (preParseAttempt.error)
    return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!preParseAttempt.allowed)
    return errorResponse("RATE_LIMITED", 429, preParseAttempt.retryAfter);

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(
      request,
      MAX_FILE_BYTES + 64 * 1024,
    );
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413);
    formData = parsed;
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const turnstileToken = textField(formData, "turnstileToken");
  if (!turnstileToken) return errorResponse("CAPTCHA_FAILED", 400);

  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (user) {
    const attempt = await consumeSubmissionAttemptRateLimit(
      request,
      "contact_inquiry",
      user.id,
    );
    if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
    if (!attempt.allowed)
      return errorResponse("RATE_LIMITED", 429, attempt.retryAfter);
  }

  const captchaOk = await verifyTurnstileToken(turnstileToken, request, {
    action: "contact_inquiry",
  });
  if (!captchaOk) return errorResponse("CAPTCHA_FAILED", 400);

  const category = textField(formData, "category");
  const inquiryType = textField(formData, "inquiryType");
  const companyName = textField(formData, "companyName");
  const contactName = textField(formData, "contactName");
  const phone = textField(formData, "phone");
  const email = textField(formData, "email").toLowerCase();
  const accountEmail = user?.email?.trim().toLowerCase() ?? null;
  const rateLimitId = user ? user.id : `anon:${clientIp(request) ?? "unknown"}`;
  const message = textField(formData, "message");
  const consented = textField(formData, "privacyConsent") === "true";
  const validType =
    category === "general"
      ? GENERAL_TYPES.has(inquiryType)
      : category === "business" && BUSINESS_TYPES.has(inquiryType);

  if (
    !validType ||
    !consented ||
    contactName.length < 1 ||
    contactName.length > 80 ||
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (accountEmail && email !== accountEmail) ||
    message.length < 1 ||
    message.length > 5000 ||
    phone.length > 40 ||
    (category === "business" &&
      (companyName.length < 1 || companyName.length > 120 || phone.length < 1))
  ) {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const fileEntry = formData.get("attachment");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (file && category !== "business")
    return errorResponse("INVALID_FILE", 400);
  if (file && file.size > MAX_FILE_BYTES)
    return errorResponse("FILE_TOO_LARGE", 413);

  const validated = file
    ? await validateFileSignature(file, "contact-attachment")
    : null;
  if (
    file &&
    (!validated || !extensionMatches(file.name, validated.extension))
  ) {
    return errorResponse("INVALID_FILE_TYPE", 400);
  }

  const rate = await consumeSubmissionRateLimit(
    request,
    "contact_inquiry",
    rateLimitId,
  );
  if (rate.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!rate.allowed) return errorResponse("RATE_LIMITED", 429, rate.retryAfter);

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const inquiryId = crypto.randomUUID();
  const attachmentPath =
    file && validated
      ? `${inquiryId}/${crypto.randomUUID()}.${validated.extension}`
      : null;

  if (file && validated && attachmentPath) {
    const { error: uploadError } = await uploadObject({
      bucket: "contact-attachments",
      path: attachmentPath,
      body: file,
      contentType: validated.mimeType,
    });
    if (uploadError) {
      await deleteObjects("contact-attachments", [attachmentPath]);
      return errorResponse("UPLOAD_FAILED", 503);
    }
  }

  const { error: insertError } = await serviceClient
    .from("contact_inquiries")
    .insert({
      id: inquiryId,
      user_id: user?.id ?? null,
      category,
      inquiry_type: inquiryType,
      company_name: category === "business" ? companyName : null,
      contact_name: contactName,
      phone: phone || null,
      email: accountEmail ?? email,
      message,
      attachment_path: attachmentPath,
      attachment_name: file ? boundedFileName(file.name) : null,
      attachment_size: file?.size ?? null,
      privacy_consent: true,
    });

  if (insertError) {
    if (attachmentPath) {
      await deleteObjects("contact-attachments", [attachmentPath]);
    }
    return errorResponse("SUBMISSION_FAILED", 503);
  }

  const response = NextResponse.json({
    id: inquiryId,
    remaining: rate.remaining,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
