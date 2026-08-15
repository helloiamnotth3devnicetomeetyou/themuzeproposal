import { NextResponse } from "next/server";
import { z } from "zod";
import { translateAdminContent } from "@/core/ai/translate-admin-content";
import { isAdmin } from "@/core/auth/admin-auth";
import { parseJsonWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { createSupabaseServerClient } from "@/core/supabase/server";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_SOURCE_CHARS = 12_000;

const localeSchema = z.enum(["en", "ja"]);
const fieldSchema = z
  .object({
    key: z
      .string()
      .regex(/^[a-z][a-zA-Z0-9]*$/)
      .max(40),
    label: z.string().trim().min(1).max(80),
    format: z.enum(["plain", "richtext"]),
    source: z.string().min(1).max(MAX_SOURCE_CHARS),
    targetLocales: z
      .array(localeSchema)
      .min(1)
      .max(2)
      .refine((locales) => new Set(locales).size === locales.length),
  })
  .strict();
const requestSchema = z
  .object({
    documentKind: z.enum(["artist", "member", "album", "notice", "schedule"]),
    fields: z.array(fieldSchema).min(1).max(10),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.fields.map((field) => field.key)).size !==
      value.fields.length
    )
      context.addIssue({ code: "custom", message: "Duplicate field key" });
    if (
      value.fields.reduce((sum, field) => sum + field.source.length, 0) >
      MAX_SOURCE_CHARS
    )
      context.addIssue({ code: "custom", message: "Source content too long" });
  });

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return response({ code: "FORBIDDEN" }, 403);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    return response({ code: "PAYLOAD_TOO_LARGE" }, 413);

  const parsed = requestSchema.safeParse(
    await parseJsonWithinLimit(request, MAX_BODY_BYTES).catch(() => null),
  );
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return response({ code: "UNAUTHORIZED" }, 401);
  if (!(await isAdmin(supabase, user.id)))
    return response({ code: "FORBIDDEN" }, 403);

  const translations = await translateAdminContent(
    parsed.data.documentKind,
    parsed.data.fields,
  );
  if (!translations) return response({ code: "TRANSLATION_FAILED" }, 503);
  return response({ translations });
}
