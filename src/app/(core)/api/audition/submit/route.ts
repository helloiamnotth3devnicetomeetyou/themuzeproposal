import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createServiceRoleClient } from "@/core/uploads/service-storage";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { validateFileSignature } from "@/core/uploads/file-signature";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import type { AuditionField, AuditionSession } from "@/admin/pages/auditions/audition-editor-model";

const MAX_BODY_BYTES = 55 * 1024 * 1024; // 50 MB data + 5 MB headroom
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per attachment
const MAX_ANSWER_LENGTH = 5000;

function errorResponse(code: string, status: number) {
  const res = NextResponse.json({ code }, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_").slice(0, 120);
}

export async function POST(request: NextRequest) {
  // ── Same-origin guard ──────────────────────────────────────────────────────
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400);

  // ── Content-length pre-check ──────────────────────────────────────────────
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return errorResponse("PAYLOAD_TOO_LARGE", 413);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);

  // ── Parse multipart form data ─────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const auditionId = typeof formData.get("auditionId") === "string"
    ? (formData.get("auditionId") as string).trim()
    : null;
  if (!auditionId) return errorResponse("MISSING_AUDITION_ID", 400);

  // ── Load & validate audition session ──────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("auditions")
    .select("id,status,start_at,end_at,form_schema,categories")
    .eq("id", auditionId)
    .eq("status", "open")
    .maybeSingle();

  if (sessionError || !session) return errorResponse("AUDITION_NOT_FOUND", 404);

  const now = new Date();
  if (session.start_at && new Date(session.start_at) > now) {
    return errorResponse("AUDITION_NOT_STARTED", 422);
  }
  if (session.end_at && new Date(session.end_at) < now) {
    return errorResponse("AUDITION_CLOSED", 422);
  }

  const schema: AuditionField[] = Array.isArray(session.form_schema)
    ? (session.form_schema as AuditionField[])
    : [];

  // ── Validate category ─────────────────────────────────────────────────────
  const rawCategory = formData.get("category");
  const selectedCategory = typeof rawCategory === "string" ? rawCategory.trim() : "";
  const categories: string[] = Array.isArray(session.categories) ? session.categories as string[] : [];
  if (categories.length > 0 && !categories.includes(selectedCategory)) {
    return errorResponse("INVALID_CATEGORY", 422);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const keyHash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`audition:${user.id}`))
    )
  ).map((b) => b.toString(16).padStart(2, "0")).join("");

  const { data: rlResult, error: rlError } = await supabase.rpc(
    "consume_submission_rate_limit",
    { p_scope: "audition_submission", p_key_hash: keyHash, p_limit: 3, p_window_seconds: 86400 },
  );
  if (rlError) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!rlResult?.[0]?.is_allowed) {
    const res = errorResponse("RATE_LIMITED", 429);
    const retryAfter = rlResult?.[0]?.retry_after_seconds ?? 86400;
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  // ── Validate dynamic form answers ─────────────────────────────────────────
  const answers: Record<string, string | string[]> = {};
  for (const field of schema) {
    if (field.type === "file") continue; // handled separately
    if (field.type === "checkbox") {
      const raw = formData.getAll(`answers[${field.id}]`);
      const values = raw.filter((v): v is string => typeof v === "string").map((v) => v.trim());
      if (field.required && values.length === 0) {
        return errorResponse("REQUIRED_FIELD_MISSING", 422);
      }
      answers[field.id] = values;
    } else {
      const raw = formData.get(`answers[${field.id}]`);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (field.required && !value) return errorResponse("REQUIRED_FIELD_MISSING", 422);
      if (value.length > MAX_ANSWER_LENGTH) return errorResponse("ANSWER_TOO_LONG", 422);
      answers[field.id] = value;
    }
  }

  // ── Handle optional file attachment ──────────────────────────────────────
  let attachmentPath: string | null = null;
  let attachmentName: string | null = null;
  let attachmentSize: number | null = null;

  const fileField = schema.find((f) => f.type === "file");
  const fileEntry = fileField ? formData.get(`answers[${fileField.id}]`) : null;

  if (fileEntry instanceof File && fileEntry.size > 0) {
    if (fileEntry.size > MAX_FILE_BYTES) return errorResponse("FILE_TOO_LARGE", 413);

    const validated = await validateFileSignature(fileEntry, "audition-attachment");
    if (!validated) return errorResponse("INVALID_FILE", 400);

    const adminClient = createServiceRoleClient();
    if (!adminClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

    const safeName = safeFileName(fileEntry.name);
    const path = `${user.id}/${auditionId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await adminClient.storage
      .from("audition-attachments")
      .upload(path, fileEntry, {
        contentType: validated.mimeType,
        upsert: false,
      });

    if (uploadError) return errorResponse("UPLOAD_FAILED", 503);

    attachmentPath = path;
    attachmentName = fileEntry.name.slice(0, 255);
    attachmentSize = fileEntry.size;
  } else if (fileField?.required) {
    return errorResponse("REQUIRED_FIELD_MISSING", 422);
  }

  // ── Check for duplicate submission (same user + audition) ─────────────────
  const { count } = await supabase
    .from("audition_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("audition_id", auditionId);
  if ((count ?? 0) > 0) return errorResponse("ALREADY_SUBMITTED", 409);

  // ── Insert submission (service_role) ──────────────────────────────────────
  const svc = createServiceRoleClient();
  if (!svc) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const userProfile = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
  const submitterName = userProfile.data?.name || user.user_metadata?.name || user.email || "";

  const { data: inserted, error: insertError } = await svc
    .from("audition_submissions")
    .insert({
      audition_id:     auditionId,
      user_id:         user.id,
      email:           user.email || null,
      name:            submitterName || null,
      category:        selectedCategory || null,
      status:          "pending",
      answers,
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
    })
    .select("id")
    .single();

  if (insertError || !inserted) return errorResponse("SUBMISSION_FAILED", 503);

  // ── Return attachment URL if uploaded ─────────────────────────────────────
  const { storageUrl } = getPublicSupabaseConfig();
  const attachmentUrl = attachmentPath
    ? `${storageUrl}/audition-attachments/${attachmentPath}`
    : null;

  const res = NextResponse.json({ id: inserted.id, attachmentUrl });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
