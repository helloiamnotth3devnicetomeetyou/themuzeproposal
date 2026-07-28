import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/core/config/public-env";

export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;

  const { url } = getPublicSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function replacePathExtension(path: string, extension: string) {
  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  const base = lastDot > lastSlash ? path.slice(0, lastDot) : path;
  return `${base}.${extension}`;
}

export function isSafeStoragePath(path: string) {
  return path.length >= 3
    && path.length <= 500
    && !path.includes("..")
    && /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$/.test(path);
}
