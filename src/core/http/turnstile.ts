import "server-only";

import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

type TurnstileExpectation = {
  action: string;
  hostname?: string;
};

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function configuredHostname(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return normalizeHostname(new URL(configured).hostname);
    } catch {
      // Production validation rejects an invalid site URL; use the request host
      // as a safe local-development fallback when validation is not strict.
    }
  }
  return normalizeHostname(request.nextUrl.hostname);
}

export async function verifyTurnstileToken(
  token: string,
  request: NextRequest,
  expectation: TurnstileExpectation,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token || !expectation.action) return false;

  const body = new URLSearchParams({ secret, response: token });
  const ip = clientIp(request);
  if (ip) body.set("remoteip", ip);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json().catch(() => null)) as
      | TurnstileResult
      | null;
    const expectedHostname = normalizeHostname(
      expectation.hostname || configuredHostname(request),
    );
    return (
      result?.success === true &&
      result.action === expectation.action &&
      normalizeHostname(result.hostname || "") === expectedHostname
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
