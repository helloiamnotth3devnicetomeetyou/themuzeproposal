import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { validateFileSignature } from "@/core/uploads/file-signature";
import { createServiceRoleClient } from "@/core/uploads/service-storage";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

function errorResponse(code: string, status: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return errorResponse("INVALID_REQUEST", 400);

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse("UNAUTHORIZED", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_FILE", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) return errorResponse("INVALID_FILE", 400);
  if (file.size > MAX_FILE_BYTES) return errorResponse("FILE_TOO_LARGE", 413);

  const validated = await validateFileSignature(file, "protect-evidence");
  if (!validated) return errorResponse("INVALID_FILE_TYPE", 400);

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return errorResponse("SERVICE_UNAVAILABLE", 503);

  const path = `${user.id}/${crypto.randomUUID()}.${validated.extension}`;
  const { error: uploadError } = await serviceClient.storage
    .from("protect-evidence")
    .upload(path, file, { contentType: validated.mimeType, upsert: false });
  if (uploadError) return errorResponse("UPLOAD_FAILED", 503);

  const response = NextResponse.json({ path });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
