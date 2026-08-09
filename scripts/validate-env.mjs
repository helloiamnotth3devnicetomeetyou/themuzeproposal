import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PROJECT_REF",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_STORAGE_URL",
  "AUTH_RATE_LIMIT_SECRET",
  "SUBMISSION_RATE_LIMIT_SECRET",
];

const strict = process.env.VERCEL_ENV === "production"
  || process.env.STRICT_ENV_VALIDATION === "1"
  || (process.env.CI === "true" && process.env.NODE_ENV === "production");
const missing = required.filter((name) => !process.env[name]?.trim());
const problems = [];
const trustedClientIpHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();

if (trustedClientIpHeader && !/^[a-z0-9-]+$/.test(trustedClientIpHeader)) {
  problems.push("TRUSTED_CLIENT_IP_HEADER must be a valid HTTP header name.");
}
if (strict && process.env.VERCEL === "1" && trustedClientIpHeader) {
  problems.push("Do not configure TRUSTED_CLIENT_IP_HEADER on Vercel.");
}
if (strict && process.env.VERCEL !== "1" && !trustedClientIpHeader) {
  problems.push("Non-Vercel production requires TRUSTED_CLIENT_IP_HEADER from a trusted reverse proxy.");
}

if (!missing.includes("NEXT_PUBLIC_SUPABASE_URL")) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
    if (projectRef && supabaseUrl.hostname.split(".")[0] !== projectRef) {
      problems.push("Supabase URL and project ref do not match.");
    }
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL?.trim();
    if (storageUrl && new URL(storageUrl).origin !== supabaseUrl.origin) {
      problems.push("Supabase storage URL must use the configured Supabase origin.");
    }
  } catch {
    problems.push("Supabase URL configuration is invalid.");
  }
}

try {
  if (process.env.NEXT_PUBLIC_SITE_URL) new URL(process.env.NEXT_PUBLIC_SITE_URL);
} catch {
  problems.push("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
}

if (process.env.AUTH_RATE_LIMIT_SECRET && process.env.AUTH_RATE_LIMIT_SECRET.length < 32) {
  problems.push("AUTH_RATE_LIMIT_SECRET must contain at least 32 characters.");
}

if (process.env.SUBMISSION_RATE_LIMIT_SECRET && process.env.SUBMISSION_RATE_LIMIT_SECRET.length < 32) {
  problems.push("SUBMISSION_RATE_LIMIT_SECRET must contain at least 32 characters.");
}

if (strict && (missing.length || problems.length)) {
  console.error("Production environment validation failed.");
  if (missing.length) console.error(`Missing variables: ${missing.join(", ")}`);
  problems.forEach((problem) => console.error(problem));
  process.exit(1);
}

if (!strict && missing.length) {
  console.warn(`Environment validation is non-strict; configure before deployment: ${missing.join(", ")}`);
}

problems.forEach((problem) => console.warn(problem));
