/**
 * Safely redirects to a path within the application to prevent Open Redirect vulnerabilities.
 * Only allows relative paths starting with a single '/' (but not '//').
 */
export function safeRedirect(value: string | string[] | null | undefined): string {
  const url = Array.isArray(value) ? value[0] : value;
  if (!url) return "/";
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  return "/";
}
