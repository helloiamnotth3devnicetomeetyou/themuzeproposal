import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/core/auth/require-admin";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { createSignedDownloadUrl } from "@/core/storage/r2";
import { boundedFileName } from "@/core/uploads/file-signature";
import { createServiceRoleClient } from "@/core/uploads/service-storage";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { isSafeStoragePath } from "@/core/uploads/service-storage";

const SIGNED_URL_TTL_SECONDS = 900;
const MAX_BODY_BYTES = 8 * 1024;

const PRIVATE_BUCKETS = [
  "contact-attachments",
  "protect-evidence",
  "audition-attachments",
] as const;
type PrivateBucket = (typeof PRIVATE_BUCKETS)[number];

function errorResponse(code: string, status: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Confirms the requested (bucket, path) is actually referenced by a row the admin is
 * allowed to view. Stands in for the RLS check Supabase Storage used to enforce. */
async function isReferencedAttachment(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bucket: PrivateBucket,
  path: string,
): Promise<boolean> {
  if (bucket === "contact-attachments") {
    const { data } = await supabase
      .from("contact_inquiries")
      .select("id")
      .eq("attachment_path", path)
      .maybeSingle();
    return Boolean(data);
  }
  if (bucket === "protect-evidence") {
    const { data } = await supabase
      .from("protect_report_attachments")
      .select("id")
      .eq("file_path", path)
      .maybeSingle();
    return Boolean(data);
  }
  const service = createServiceRoleClient();
  if (!service) return false;
  const { data, error } = await service.rpc(
    "audition_submission_has_attachment",
    { p_path: path },
  );
  if (error) return false;
  return data === true;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return errorResponse("INVALID_REQUEST", 400);

  const auth = await requireAdmin();
  if (auth.denied) return errorResponse(auth.denied.code, auth.denied.status);
  const { supabase } = auth;

  const body = (await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(
    () => null,
  )) as { bucket?: unknown; path?: unknown; downloadName?: unknown } | null;
  const bucket = typeof body?.bucket === "string" ? body.bucket : "";
  const path = typeof body?.path === "string" ? body.path : "";
  const downloadName =
    typeof body?.downloadName === "string"
      ? boundedFileName(body.downloadName)
      : undefined;
  if (
    !PRIVATE_BUCKETS.includes(bucket as PrivateBucket) ||
    !isSafeStoragePath(path)
  ) {
    return errorResponse("INVALID_REQUEST", 400);
  }

  if (
    !(await isReferencedAttachment(supabase, bucket as PrivateBucket, path))
  ) {
    return errorResponse("FORBIDDEN", 403);
  }

  const url = await createSignedDownloadUrl(
    bucket,
    path,
    SIGNED_URL_TTL_SECONDS,
    downloadName,
  );
  if (!url) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const response = NextResponse.json({ url });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
