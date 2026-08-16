import { after, NextResponse, type NextRequest } from "next/server";
import {
  classify,
  type ProtectClassification,
} from "@/core/ai/classify-inquiry";
import { isSameOriginRequest } from "@/core/http/same-origin";
import {
  consumeSubmissionIpAttemptRateLimit,
  consumeSubmissionUserAttemptRateLimit,
  finalizeSubmissionRateLimit,
  releaseSubmissionRateLimit,
  reserveSubmissionRateLimit,
} from "@/core/http/submission-rate-limit";
import { deleteObjects, uploadObject } from "@/core/storage/r2";
import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  boundedFileName,
  extensionMatches,
  validateFileSignature,
} from "@/core/uploads/file-signature";
import { createServiceRoleClient } from "@/core/uploads/service-storage";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { verifyTurnstileToken } from "@/core/http/turnstile";
import { isUuid } from "@/core/utils/uuid";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 3;
const MAX_POST_URL_LENGTH = 2048;
const REPORT_TYPES = new Set([
  "defamation",
  "harassment",
  "impersonation",
  "copyright",
  "privacy",
  "other",
]);
const PLATFORMS = new Set([
  "instagram",
  "x",
  "youtube",
  "tiktok",
  "facebook",
  "community",
  "other",
]);
async function classifyProtectReport(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  reportId: string,
  reportType: string,
  title: string,
  content: string,
  platform: string,
) {
  if (!serviceClient) return;
  const result: ProtectClassification | null = await classify({
    domain: "protect",
    text: `${title}\n\n${content}`,
    type: reportType,
    metadata: { platform },
  });
  if (!result) return;

  await serviceClient
    .from("protect_reports")
    .update({
      severity: result.severity,
      ai_reasoning: result.reasoning,
      ai_classified_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .is("ai_classified_at", null);
}

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

function canonicalHttpUrl(value: string) {
  if (value.length > MAX_POST_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const canonical = url.href;
    return canonical.length <= MAX_POST_URL_LENGTH ? canonical : null;
  } catch {
    return null;
  }
}

function validDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400);

  const preParseAttempt = await consumeSubmissionIpAttemptRateLimit(
    request,
    "protect_report",
  );
  if (preParseAttempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!preParseAttempt.allowed)
    return errorResponse("RATE_LIMITED", 429, preParseAttempt.retryAfter);

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(
      request,
      MAX_FILES * MAX_FILE_BYTES + 128 * 1024,
    );
    if (!parsed) return errorResponse("FILE_TOO_LARGE", 413);
    formData = parsed;
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const turnstileToken = textField(formData, "turnstileToken");
  const captchaOk = await verifyTurnstileToken(turnstileToken, request, {
    action: "protect_report",
  });
  if (!captchaOk) return errorResponse("CAPTCHA_FAILED", 400);

  const artistId = textField(formData, "artistId");
  const reportType = textField(formData, "reportType");
  const title = textField(formData, "title");
  const content = textField(formData, "content");
  const platform = textField(formData, "platform");
  const postUrl = canonicalHttpUrl(textField(formData, "postUrl"));
  const postedAt = textField(formData, "postedAt");
  const authorName = textField(formData, "authorName");
  const postIp = textField(formData, "postIp");
  const confirmed = textField(formData, "confirmation") === "true";
  const files = formData
    .getAll("evidence")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (
    !artistId ||
    !isUuid(artistId) ||
    !REPORT_TYPES.has(reportType) ||
    title.length < 1 ||
    title.length > 120 ||
    content.length < 1 ||
    content.length > 5000 ||
    !PLATFORMS.has(platform) ||
    !postUrl ||
    !validDate(postedAt) ||
    postedAt > new Date().toISOString().slice(0, 10) ||
    authorName.length < 1 ||
    authorName.length > 120 ||
    postIp.length > 64 ||
    !confirmed ||
    files.length < 1 ||
    files.length > MAX_FILES
  ) {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);

  const attempt = await consumeSubmissionUserAttemptRateLimit(
    "protect_report",
    user.id,
  );
  if (attempt.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!attempt.allowed)
    return errorResponse("RATE_LIMITED", 429, attempt.retryAfter);

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const { data: artist, error: artistError } = await serviceClient
    .from("artists")
    .select("id")
    .eq("id", artistId)
    .eq("is_active", true)
    .maybeSingle();
  if (artistError) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!artist) return errorResponse("INVALID_REQUEST", 400);

  if (files.some((file) => file.size > MAX_FILE_BYTES))
    return errorResponse("FILE_TOO_LARGE", 413);
  const validatedFiles = await Promise.all(
    files.map(async (file) => ({
      file,
      validated: await validateFileSignature(file, "protect-evidence"),
    })),
  );
  if (
    validatedFiles.some(
      ({ file, validated }) =>
        !validated || !extensionMatches(file.name, validated.extension),
    )
  ) {
    return errorResponse("INVALID_FILE_TYPE", 400);
  }

  const rate = await reserveSubmissionRateLimit(
    request,
    "protect_report",
    user.id,
  );
  if (rate.error) return errorResponse("SERVICE_UNAVAILABLE", 503);
  if (!rate.allowed) return errorResponse("RATE_LIMITED", 429, rate.retryAfter);
  const reservationId = rate.reservationId;
  if (!reservationId) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const reportId = crypto.randomUUID();
  const paths: string[] = [];
  let reportCreated = false;
  try {
    for (const { file, validated } of validatedFiles) {
      if (!validated) return errorResponse("INVALID_FILE_TYPE", 400);
      const path = `${user.id}/${crypto.randomUUID()}.${validated.extension}`;
      paths.push(path);
      const { error: uploadError } = await uploadObject({
        bucket: "protect-evidence",
        path,
        body: file,
        contentType: validated.mimeType,
      });
      if (uploadError) throw new Error("UPLOAD_FAILED");
    }

    const { error: insertError } = await serviceClient
      .from("protect_reports")
      .insert({
        id: reportId,
        user_id: user.id,
        reporter_email: user.email || null,
        artist_id: artistId,
        report_type: reportType,
        title,
        content,
        platform,
        post_url: postUrl,
        posted_at: postedAt,
        author_name: authorName,
        post_ip: postIp || null,
        confirmation: true,
      });
    if (insertError) throw new Error("SUBMISSION_FAILED");
    reportCreated = true;

    const { error: attachmentError } = await serviceClient
      .from("protect_report_attachments")
      .insert(
        paths.map((filePath, index) => ({
          report_id: reportId,
          file_path: filePath,
          file_name: boundedFileName(files[index].name),
        })),
      );
    if (attachmentError) throw new Error("SUBMISSION_FAILED");
  } catch {
    try {
      if (paths.length) await deleteObjects("protect-evidence", paths);
    } catch {
      // Keep the original submission failure; cleanup is best effort.
    } finally {
      if (reportCreated) {
        try {
          await serviceClient
            .from("protect_reports")
            .delete()
            .eq("id", reportId);
        } catch {
          // Keep the original submission failure; cleanup is best effort.
        }
      }
      await releaseSubmissionRateLimit(reservationId).catch(() => undefined);
    }
    return errorResponse("SUBMISSION_FAILED", 503);
  }

  await finalizeSubmissionRateLimit(reservationId);

  const classifyAfterInsert = () =>
    classifyProtectReport(
      serviceClient,
      reportId,
      reportType,
      title,
      content,
      platform,
    ).catch(() => undefined);
  after(classifyAfterInsert);

  const response = NextResponse.json({
    id: reportId,
    createdAt: new Date().toISOString(),
    remaining: rate.remaining,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
