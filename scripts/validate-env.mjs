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

const strict =
  process.env.VERCEL_ENV === "production" ||
  process.env.STRICT_ENV_VALIDATION === "1" ||
  (process.env.CI === "true" && process.env.NODE_ENV === "production");
const missing = required.filter((name) => !process.env[name]?.trim());
const problems = [];
const trustedClientIpHeader =
  process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();

if (trustedClientIpHeader && !/^[a-z0-9-]+$/.test(trustedClientIpHeader)) {
  problems.push("TRUSTED_CLIENT_IP_HEADER must be a valid HTTP header name.");
}
if (strict && process.env.VERCEL === "1" && trustedClientIpHeader) {
  problems.push("Do not configure TRUSTED_CLIENT_IP_HEADER on Vercel.");
}
if (strict && process.env.VERCEL !== "1" && !trustedClientIpHeader) {
  problems.push(
    "Non-Vercel production requires TRUSTED_CLIENT_IP_HEADER from a trusted reverse proxy.",
  );
}

if (!missing.includes("NEXT_PUBLIC_SUPABASE_URL")) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (strict && supabaseUrl.protocol !== "https:")
      problems.push("NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production.");
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
    const derivedRef = supabaseUrl.hostname.split(".")[0];
    const isSupabaseHostname = supabaseUrl.hostname.endsWith(".supabase.co");
    if (!isSupabaseHostname) {
      problems.push(
        "NEXT_PUBLIC_SUPABASE_URL must use a *.supabase.co hostname.",
      );
    }
    if (
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
  console.error("Production environment validation failed.");
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
