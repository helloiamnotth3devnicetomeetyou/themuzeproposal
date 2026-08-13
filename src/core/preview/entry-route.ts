import { draftMode } from "next/headers";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { parseFormDataWithinLimit } from "@/core/http/request-body";
import { isSameOriginRequest } from "@/core/http/same-origin";
import { isPreviewToken, PREVIEW_SESSION_COOKIE } from "@/core/preview/types";
import { createSupabaseServerClient } from "@/core/supabase/server";

const ALLOWED_PATHS = [
  /^\/about\/?$/,
  /^\/notice\/[^/]+\/?$/,
  /^\/[^/]+\/artist(?:\/[^/]+)?\/?$/,
  /^\/[^/]+\/discography\/?$/,
  /^\/[^/]+\/schedule\/?$/,
  /^\/[^/]+\/notice\/[^/]+\/?$/,
];
const MAX_PREVIEW_BODY_BYTES = 16 * 1024;
const MAX_PREVIEW_BODY_TIMEOUT_MS = 5_000;
const MAX_PREVIEW_PARTS = 4;
const MAX_PREVIEW_METADATA_BYTES = 8 * 1024;
const MAX_PREVIEW_TOKEN_LENGTH = 64;
const MAX_PREVIEW_PATH_LENGTH = 2_048;

const isAllowedPreviewPath = (pathname: string) =>
  ALLOWED_PATHS.some((pattern) => pattern.test(pathname));

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  let formData: FormData;
  try {
    const parsed = await parseFormDataWithinLimit(
      request,
      MAX_PREVIEW_BODY_BYTES,
      MAX_PREVIEW_BODY_TIMEOUT_MS,
      {
        maxParts: MAX_PREVIEW_PARTS,
        maxMetadataBytes: MAX_PREVIEW_METADATA_BYTES,
      },
    );
    if (!parsed || Array.from(parsed.keys()).length > MAX_PREVIEW_PARTS) {
      return NextResponse.json(
        { code: "INVALID_PREVIEW_REQUEST" },
        { status: 413 },
      );
    }
    formData = parsed;
  } catch {
    return NextResponse.json(
      { code: "INVALID_PREVIEW_REQUEST" },
      { status: 400 },
    );
  }

  const requestUrl = new URL(request.url);
  const token =
    typeof formData.get("token") === "string"
      ? String(formData.get("token"))
      : "";
  const rawPath =
    typeof formData.get("path") === "string"
      ? String(formData.get("path"))
      : "";

  if (
    token.length > MAX_PREVIEW_TOKEN_LENGTH ||
    rawPath.length > MAX_PREVIEW_PATH_LENGTH ||
    !isPreviewToken(token) ||
    !rawPath.startsWith("/")
  ) {
    return NextResponse.json(
      { code: "INVALID_PREVIEW_REQUEST" },
      { status: 400 },
    );
  }

  const target = new URL(rawPath, requestUrl.origin);
  if (
    target.origin !== requestUrl.origin ||
    !isAllowedPreviewPath(target.pathname)
  ) {
    return NextResponse.json({ code: "INVALID_PREVIEW_PATH" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? undefined : data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  }
  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ code: "ADMIN_REQUIRED" }, { status: 403 });
  }

  const draft = await draftMode();
  draft.enable();
  target.searchParams.set("preview", token);
  const response = NextResponse.redirect(target, { status: 307 });
  (await cookies()).set(PREVIEW_SESSION_COOKIE, `${userId}:${token}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
