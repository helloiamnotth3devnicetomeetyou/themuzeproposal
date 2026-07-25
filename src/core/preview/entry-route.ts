import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/core/auth/admin-auth";
import { isPreviewToken } from "@/core/preview/types";
import { createSupabaseServerClient } from "@/core/supabase/server";

const ALLOWED_PATHS = [
  /^\/about\/?$/,
  /^\/notice\/[^/]+\/?$/,
  /^\/[^/]+\/artist(?:\/[^/]+)?\/?$/,
  /^\/[^/]+\/discography\/?$/,
  /^\/[^/]+\/schedule\/?$/,
  /^\/[^/]+\/notice\/[^/]+\/?$/,
];

const isAllowedPreviewPath = (pathname: string) =>
  ALLOWED_PATHS.some((pattern) => pattern.test(pathname));

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token") ?? "";
  const rawPath = requestUrl.searchParams.get("path") ?? "";

  if (!isPreviewToken(token) || !rawPath.startsWith("/")) {
    return NextResponse.json({ code: "INVALID_PREVIEW_REQUEST" }, { status: 400 });
  }

  const target = new URL(rawPath, requestUrl.origin);
  if (target.origin !== requestUrl.origin || !isAllowedPreviewPath(target.pathname)) {
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
  return NextResponse.redirect(target, { status: 307 });
}
