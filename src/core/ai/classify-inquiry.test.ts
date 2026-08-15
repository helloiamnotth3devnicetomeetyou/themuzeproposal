// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  classify,
  redactSensitiveText,
  type ContactClassification,
  type ProtectClassification,
} from "./classify-inquiry";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function openRouterResponse(content: unknown) {
  return new Response(
    JSON.stringify({
      id: "test",
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  );
}

describe("redactSensitiveText", () => {
  it("redacts common direct identifiers", () => {
    const redacted = redactSensitiveText(
      "a@example.com +1 (555) 123-4567 from 192.168.1.2 https://example.com/a",
    );

    expect(redacted).not.toContain("a@example.com");
    expect(redacted).not.toContain("555");
    expect(redacted).not.toContain("192.168.1.2");
    expect(redacted).not.toContain("https://example.com");
  });
});

describe("classify", () => {
  it("classifies contact and sends strict, privacy-preserving options", async () => {
    fetchMock.mockResolvedValue(
      openRouterResponse({
        urgency: "urgent",
        isLikelySpam: false,
        reasoning: "Credible privacy risk needs prompt review.",
      }),
    );

    const result = await classify({
      domain: "contact",
      type: "site_error",
      text: "Please help a@example.com at +1 (555) 123-4567; https://example.com",
      metadata: { category: "general", platform: "web" },
    });

    expect(result).toEqual({
      urgency: "urgent",
      isLikelySpam: false,
      reasoning: "Credible privacy risk needs prompt review.",
    } satisfies ContactClassification);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      model: string;
      temperature: number;
      max_tokens: number;
      provider: Record<string, unknown>;
      response_format: {
        type: string;
        json_schema: { strict: boolean };
      };
    };
    expect(body.model).toBe("google/gemini-3.1-flash-lite");
    expect(body.temperature).toBe(0);
    expect(body.max_tokens).toBe(256);
    expect(body.provider).toEqual({
      data_collection: "deny",
      zdr: true,
      require_parameters: true,
    });
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(JSON.stringify(body)).toContain("ordinary pricing question");
    expect(JSON.stringify(body)).not.toContain("a@example.com");
    expect(JSON.stringify(body)).not.toContain("555");
    expect(JSON.stringify(body)).not.toContain("https://example.com");
  });

  it("classifies protect reports with the severity schema", async () => {
    fetchMock.mockResolvedValue(
      openRouterResponse({
        severity: "critical",
        reasoning: "The report indicates an immediate safety risk.",
      }),
    );

    await expect(
      classify({
        domain: "protect",
        type: "privacy",
        text: "Immediate safety concern",
      }),
    ).resolves.toEqual({
      severity: "critical",
      reasoning: "The report indicates an immediate safety risk.",
    } satisfies ProtectClassification);
  });

  it("fails closed for missing credentials, malformed responses, and invalid output", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(
      classify({ domain: "contact", type: "other", text: "hello" }),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(
      classify({ domain: "protect", type: "other", text: "hello" }),
    ).resolves.toBeNull();

    fetchMock.mockResolvedValue(
      openRouterResponse({ severity: "normal", unexpected: true, reasoning: "ok" }),
    );
    await expect(
      classify({ domain: "protect", type: "other", text: "hello" }),
    ).resolves.toBeNull();
  });

  it("returns null when the provider fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(
      classify({ domain: "contact", type: "other", text: "hello" }),
    ).resolves.toBeNull();
  });
});
