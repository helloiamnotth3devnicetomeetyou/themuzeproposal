/** Returns a navigable HTTP(S) URL, or undefined for unsafe/malformed input. */
export function safeHref(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;

  const href = value.trim();
  if (!href) return undefined;

  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}
