type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
  projectRef: string;
  storageUrl: string;
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
  const url = required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const parsedUrl = parseUrl(url, "NEXT_PUBLIC_SUPABASE_URL");
  const derivedProjectRef = parsedUrl.hostname.split(".")[0];
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim() || derivedProjectRef;
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.trim()
    || `${parsedUrl.origin}/storage/v1/object/public`;

  if (projectRef !== derivedProjectRef) {
    throw new Error("Supabase project configuration is inconsistent.");
  }

  parseUrl(storageUrl, "NEXT_PUBLIC_SUPABASE_STORAGE_URL");
  return { url: parsedUrl.origin, anonKey, projectRef, storageUrl: storageUrl.replace(/\/+$/, "") };
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return "http://localhost:3000";
  return parseUrl(configured, "NEXT_PUBLIC_SITE_URL").origin;
}
