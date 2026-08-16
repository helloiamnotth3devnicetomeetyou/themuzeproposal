import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_RATE_LIMIT_SECRET",
  "SUBMISSION_RATE_LIMIT_SECRET",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BUCKET",
  "R2_PRIVATE_BUCKET",
  "NEXT_PUBLIC_R2_PUBLIC_URL",
];

function hasValue(value) {
  return Boolean(value?.trim());
}

function isLocalHostname(hostname) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

function isLocalDevelopmentEnvironment(env = process.env) {
  if (env.NODE_ENV !== "development") return false;
  if (
    hasValue(env.CI) ||
    hasValue(env.GITHUB_ACTIONS) ||
    hasValue(env.VERCEL) ||
    hasValue(env.VERCEL_ENV) ||
    env.STRICT_ENV_VALIDATION === "1"
  )
    return false;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return true;
  try {
    return isLocalHostname(new URL(siteUrl).hostname);
  } catch {
    return false;
  }
}

const localDevelopment = isLocalDevelopmentEnvironment();
const strict =
  process.env.NODE_ENV === "production" ||
  hasValue(process.env.VERCEL) ||
  hasValue(process.env.VERCEL_ENV) ||
  hasValue(process.env.CI) ||
  hasValue(process.env.GITHUB_ACTIONS) ||
  (process.env.NODE_ENV === "development" && !localDevelopment) ||
  process.env.STRICT_ENV_VALIDATION === "1";
const missing = required.filter((name) => !process.env[name]?.trim());
const problems = [];
const trustedClientIpHeader =
  process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();

if (trustedClientIpHeader && !/^[a-z0-9-]+$/.test(trustedClientIpHeader)) {
  problems.push("TRUSTED_CLIENT_IP_HEADER must be a valid HTTP header name.");
}
if (strict && !hasValue(process.env.VERCEL) && !trustedClientIpHeader) {
  problems.push(
    "Non-Vercel production requires TRUSTED_CLIENT_IP_HEADER from a trusted reverse proxy.",
  );
}

if (!missing.includes("NEXT_PUBLIC_SUPABASE_URL")) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const isCiLocalSupabase =
      hasValue(process.env.CI) && supabaseUrl.hostname === "127.0.0.1";
    if (strict && supabaseUrl.protocol !== "https:" && !isCiLocalSupabase)
      problems.push("NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production.");
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
    const derivedRef = supabaseUrl.hostname.split(".")[0];
    const isSupabaseHostname = supabaseUrl.hostname.endsWith(".supabase.co");
    if (!isSupabaseHostname && !isCiLocalSupabase) {
      problems.push(
        "NEXT_PUBLIC_SUPABASE_URL must use a *.supabase.co hostname.",
      );
    }
    if (
      !isCiLocalSupabase &&
      projectRef &&
      (derivedRef !== projectRef ||
        supabaseUrl.hostname !== `${projectRef}.supabase.co`)
    ) {
      problems.push(
        `Supabase URL and project ref do not match. (URL host ref: "${derivedRef}" [len ${derivedRef.length}], PROJECT_REF: "${projectRef}" [len ${projectRef.length}])`,
      );
    }
  } catch {
    problems.push("Supabase URL configuration is invalid.");
  }
}

if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
  try {
    const r2Url = new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);
    if (strict && r2Url.protocol !== "https:")
      problems.push("NEXT_PUBLIC_R2_PUBLIC_URL must use HTTPS in production.");
  } catch {
    problems.push("NEXT_PUBLIC_R2_PUBLIC_URL must be an absolute URL.");
  }
}

try {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
    if (strict && siteUrl.protocol !== "https:")
      problems.push("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
  }
} catch {
  problems.push("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
}

if (
  process.env.AUTH_RATE_LIMIT_SECRET &&
  process.env.AUTH_RATE_LIMIT_SECRET.length < 32
) {
  problems.push("AUTH_RATE_LIMIT_SECRET must contain at least 32 characters.");
}

if (
  process.env.SUBMISSION_RATE_LIMIT_SECRET &&
  process.env.SUBMISSION_RATE_LIMIT_SECRET.length < 32
) {
  problems.push(
    "SUBMISSION_RATE_LIMIT_SECRET must contain at least 32 characters.",
  );
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
if (Boolean(turnstileSiteKey) !== Boolean(turnstileSecretKey)) {
  problems.push(
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.",
  );
}

if (strict && (missing.length || problems.length)) {
  console.error("Deployment environment validation failed.");
  if (missing.length) console.error(`Missing variables: ${missing.join(", ")}`);
  problems.forEach((problem) => console.error(problem));
  process.exit(1);
}

if (!strict && missing.length) {
  console.warn(
    `Environment validation is non-strict; configure before deployment: ${missing.join(", ")}`,
  );
}

problems.forEach((problem) => console.warn(problem));
