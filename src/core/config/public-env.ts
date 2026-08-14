type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
  projectRef: string;
};

function required(value: string | undefined, name: string) {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseUrl(value: string, name: string) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const anonKey = required(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  const parsedUrl = parseUrl(url, "NEXT_PUBLIC_SUPABASE_URL");
  const isCiLocalSupabase =
    process.env.CI === "true" && parsedUrl.hostname === "127.0.0.1";
  if (
    typeof window === "undefined" &&
    process.env.NODE_ENV === "production" &&
    parsedUrl.protocol !== "https:" &&
    !isCiLocalSupabase
  )
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production.");
  const derivedProjectRef = parsedUrl.hostname.split(".")[0];
  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim() || derivedProjectRef;

  if (projectRef !== derivedProjectRef) {
    throw new Error("Supabase project configuration is inconsistent.");
  }

  return { url: parsedUrl.origin, anonKey, projectRef };
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production")
      throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_SITE_URL",
      );
    return "http://localhost:3000";
  }
  return parseUrl(configured, "NEXT_PUBLIC_SITE_URL").origin;
}

export function getTurnstileSiteKey() {
  return required(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  );
}
