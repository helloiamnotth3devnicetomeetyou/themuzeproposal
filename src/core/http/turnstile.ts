import "server-only";

import type { NextRequest } from "next/server";
import { clientIp } from "@/core/http/client-ip";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

export async function verifyTurnstileToken(token: string, request: NextRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token) return false;

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
    const result = await response.json().catch(() => null) as { success?: boolean } | null;
    return result?.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
