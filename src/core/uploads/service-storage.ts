import "server-only";

export { createServiceRoleClient } from "@/core/supabase/service";

export function replacePathExtension(path: string, extension: string) {
  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  const base = lastDot > lastSlash ? path.slice(0, lastDot) : path;
  return `${base}.${extension}`;
}

export function isSafeStoragePath(path: string) {
  return (
    path.length >= 3 &&
    path.length <= 500 &&
    !path.includes("..") &&
    /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$/.test(path)
  );
}
