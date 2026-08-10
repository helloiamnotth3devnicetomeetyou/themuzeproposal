import "server-only";

import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { AuditionAnswer, AuditionCampaign, AuditionFormField } from "@/core/auditions/types";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { consumeSubmissionAttemptRateLimit, consumeSubmissionRateLimit } from "@/core/http/submission-rate-limit";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { extensionMatches, validateFileSignature } from "@/core/uploads/file-signature";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

const MAX_BODY_BYTES = 30 * 1024 * 1024 + 256 * 1024;
const EMAIL_KEYS = new Set(["email", "applicant_email"]);
class SubmissionConflictError extends Error {}

function databaseError(error: unknown) {
  if (!error || typeof error !== "object") return { code: "", message: "" };
  return {
    code: "code" in error && typeof error.code === "string" ? error.code : "",
    message: "message" in error && typeof error.message === "string" ? error.message : "",
  };
}

function errorResponse(code: string, status: number, retryAfter?: number) {
  const result = NextResponse.json({ code }, { status });
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("X-Content-Type-Options", "nosniff");
  if (retryAfter) result.headers.set("Retry-After", String(retryAfter));
  return result;
}

function text(formData: FormData, key: string) {
  const value = formData.get(`answers[${key}]`);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value;
}

function accepts(mimeType: string, accepted: string[]) {
  return !accepted.length || accepted.some((item) => item === mimeType || (item.endsWith("/*") && mimeType.startsWith(item.slice(0, -1))));
}

function storedFile(value: AuditionAnswer | undefined): value is Extract<AuditionAnswer, { path: string }> {
  return typeof value === "object" && !Array.isArray(value) && typeof value.path === "string";
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400);
  const session = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await session.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);
  const attempt = await consumeSubmissionAttemptRateLimit(request, "audition_submission", user.id);
  if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!attempt.allowed) return errorResponse("RATE_LIMITED", 429, attempt.retryAfter);
  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(request, MAX_BODY_BYTES);
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413);
    formData = parsed;
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const campaignId = typeof formData.get("campaignId") === "string" ? String(formData.get("campaignId")).trim() : "";
  const requestedSubmissionId = typeof formData.get("submissionId") === "string" ? String(formData.get("submissionId")).trim() : "";
  const service = createServiceRoleClient();
  if (!campaignId || !service) return errorResponse(service ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE", service ? 400 : 503);

  const now = new Date().toISOString();
  const [campaignResult, fieldResult] = await Promise.all([
    service.from("audition_campaigns").select("id,title,description,description_i18n,is_active,starts_at,ends_at,created_at,updated_at").eq("id", campaignId).eq("is_active", true).maybeSingle(),
    service.from("audition_form_fields").select("id,campaign_id,field_key,label_i18n,help_text,field_type,options,required,max_length,max_file_size_mb,accepted_file_types,sort_order,is_active,is_primary_label").eq("campaign_id", campaignId).eq("is_active", true).order("sort_order"),
  ]);
  if (campaignResult.error || fieldResult.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  const activeCampaign = campaignResult.data as AuditionCampaign | null;
  const fields = (fieldResult.data ?? []) as AuditionFormField[];
  if (!activeCampaign || (activeCampaign.starts_at && Date.parse(activeCampaign.starts_at) > Date.parse(now)) || (activeCampaign.ends_at && Date.parse(activeCampaign.ends_at) < Date.parse(now))) {
    return errorResponse("CAMPAIGN_CLOSED", 404);
  }

  const { data: existing, error: existingError } = requestedSubmissionId
    ? await service.from("audition_submissions").select("id,campaign_id,answers,status,reviewer_notes,reviewed_by,reviewed_at,created_at,updated_at").eq("id", requestedSubmissionId).eq("user_id", user.id).maybeSingle()
    : { data: null, error: null };
  if (existingError) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (requestedSubmissionId && (!existing || existing.campaign_id !== campaignId)) return errorResponse("SUBMISSION_NOT_FOUND", 404);
  if (existing && (existing.status !== "pending" || existing.reviewer_notes !== null || existing.reviewed_by !== null || existing.reviewed_at !== null)) {
    return errorResponse("SUBMISSION_NOT_EDITABLE", 409);
  }
  if (!requestedSubmissionId) {
    const { count, error } = await service.from("audition_submissions").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("user_id", user.id);
    if (error) return errorResponse("SERVICE_UNAVAILABLE", 503);
    if (count) return errorResponse("ALREADY_SUBMITTED", 409);
  }

  const answers: Record<string, AuditionAnswer> = {};
  const pendingFiles: Array<{ field: AuditionFormField; file: File; extension: string; mimeType: string }> = [];
  for (const field of fields) {
    if (field.field_type === "file") {
      const entry = formData.get(`answers[${field.field_key}]`);
      const file = entry instanceof File && entry.size ? entry : null;
      if (!file) {
        const previous = existing?.answers?.[field.field_key] as AuditionAnswer | undefined;
        if (formData.get(`keepFiles[${field.field_key}]`) === "true" && storedFile(previous)) {
          answers[field.field_key] = previous;
          continue;
        }
        if (field.required) return errorResponse("REQUIRED_FIELD_MISSING", 422);
        continue;
      }
      if (file.size > (field.max_file_size_mb ?? 20) * 1024 * 1024) return errorResponse("FILE_TOO_LARGE", 413);
      const validated = await validateFileSignature(file, "audition-attachment");
      if (!validated || !extensionMatches(file.name, validated.extension) || !accepts(validated.mimeType, field.accepted_file_types)) {
        return errorResponse("INVALID_FILE_TYPE", 422);
      }
      pendingFiles.push({ field, file, extension: validated.extension, mimeType: validated.mimeType });
      continue;
    }

    if (field.field_type === "checkbox") {
      const values = formData.getAll(`answers[${field.field_key}]`).filter((value): value is string => typeof value === "string").map((value) => value.trim());
      if (field.required && !values.length) return errorResponse("REQUIRED_FIELD_MISSING", 422);
      if (new Set(values).size !== values.length || values.some((value) => !field.options.includes(value))) return errorResponse("INVALID_OPTION", 422);
      answers[field.field_key] = values;
      continue;
    }

    const value = text(formData, field.field_key);
    if (field.required && !value) return errorResponse("REQUIRED_FIELD_MISSING", 422);
    if (field.field_type === "consent" && value !== "true") return errorResponse("CONSENT_REQUIRED", 422);
    if ((field.field_type === "select" || field.field_type === "radio") && value && !field.options.includes(value)) return errorResponse("INVALID_OPTION", 422);
    if (field.field_type === "date" && value && !validDate(value)) return errorResponse("INVALID_DATE", 422);
    if ((field.field_type === "short_text" || field.field_type === "long_text") && value.length > (field.max_length ?? (field.field_type === "short_text" ? 255 : 5000))) return errorResponse("ANSWER_TOO_LONG", 422);
    answers[field.field_key] = value;
  }

  const emailField = fields.find((field) => EMAIL_KEYS.has(field.field_key));
  const email = emailField ? text(formData, emailField.field_key).toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return errorResponse("VALID_EMAIL_REQUIRED", 422);
  const accountEmail = user.email?.trim().toLowerCase() ?? "";
  if (!accountEmail || !user.email_confirmed_at || email !== accountEmail) return errorResponse("EMAIL_ACCOUNT_MISMATCH", 422);
  answers[emailField!.field_key] = accountEmail;
  const secret = process.env.SUBMISSION_RATE_LIMIT_SECRET?.trim();
  if (!secret) return errorResponse("SERVICE_UNAVAILABLE", 503);
  const emailHash = createHmac("sha256", secret).update(`${campaignId}:${accountEmail}`).digest("hex");
  let duplicateQuery = service.from("audition_submissions").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("applicant_email_hash", emailHash);
  if (existing) duplicateQuery = duplicateQuery.neq("id", existing.id);
  const { count, error: duplicateError } = await duplicateQuery;
  if (duplicateError) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (count) return errorResponse("ALREADY_SUBMITTED", 409);

  const rate = await consumeSubmissionRateLimit(request, "audition_submission", user.id);
  if (rate.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!rate.allowed) return errorResponse("RATE_LIMITED", 429, rate.retryAfter);

  const submissionId = requestedSubmissionId || crypto.randomUUID();
  const uploaded: string[] = [];
  let persistedSubmission: { created_at?: string; updated_at?: string } | null = null;
  try {
    for (const { field, file, extension, mimeType } of pendingFiles) {
      const path = `${campaignId}/${submissionId}/${field.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await service.storage.from("audition-attachments").upload(path, file, { contentType: mimeType, upsert: false });
      if (error) throw error;
      uploaded.push(path);
      answers[field.field_key] = { path, name: file.name.slice(0, 255), size: file.size, mimeType };
    }
    const primary = fields.find((field) => field.is_primary_label);
    const primaryAnswer = primary ? answers[primary.field_key] : null;
    const writeResult = await service.rpc("save_audition_submission", {
      p_submission_id: submissionId,
      p_campaign_id: campaignId,
      p_user_id: user.id,
      p_name: typeof primaryAnswer === "string" ? primaryAnswer : null,
      p_answers: answers,
      p_form_snapshot: fields,
      p_applicant_email_hash: emailHash,
    });
    if (writeResult.error) throw writeResult.error;
    const persisted = Array.isArray(writeResult.data) ? writeResult.data[0] : writeResult.data;
    if (!persisted) throw new SubmissionConflictError();
    persistedSubmission = persisted;
    if (existing) {
      const retained = new Set(Object.values(answers).filter(storedFile).map((file) => file.path));
      const replaced = Object.values(existing.answers as Record<string, AuditionAnswer>).filter(storedFile).map((file) => file.path).filter((path) => !retained.has(path));
      if (replaced.length) await service.storage.from("audition-attachments").remove(replaced);
    }
  } catch (error) {
    if (uploaded.length) await service.storage.from("audition-attachments").remove(uploaded);
    if (error instanceof SubmissionConflictError) return errorResponse("SUBMISSION_CONFLICT", 409);
    const dbError = databaseError(error);
    if (dbError.code === "P0001" && dbError.message === "CAMPAIGN_CLOSED") return errorResponse("CAMPAIGN_CLOSED", 404);
    if (dbError.code === "P0001" && dbError.message === "SUBMISSION_CONFLICT") return errorResponse("SUBMISSION_CONFLICT", 409);
    if (dbError.code === "23505") return errorResponse("ALREADY_SUBMITTED", 409);
    return errorResponse("SUBMISSION_FAILED", 503);
  }

  const timestamp = new Date().toISOString();
  const result = NextResponse.json({ remaining: rate.remaining, submission: { id: submissionId, campaign_id: campaignId, user_id: user.id, answers, form_snapshot: fields, status: "pending", reviewer_notes: null, reviewed_by: null, reviewed_at: null, created_at: existing?.created_at ?? persistedSubmission?.created_at ?? timestamp, updated_at: persistedSubmission?.updated_at ?? timestamp } }, { status: existing ? 200 : 201 });
  result.headers.set("Cache-Control", "no-store");
  return result;
}
