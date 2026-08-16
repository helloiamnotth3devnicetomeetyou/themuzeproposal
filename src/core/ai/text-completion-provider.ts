import "server-only";

import { z } from "zod";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";

type ChatMessage = { role: string; content: string };

const providerResponseSchema = z
  .object({
    choices: z
      .array(
        z.object({
          message: z.object({ content: z.string().min(1) }).passthrough(),
        }),
      )
      .min(1),
  })
  .passthrough();

/**
 * Provider seam for server-side JSON text generation. Add a provider here;
 * callers only provide prompts, a JSON schema, and a token limit.
 */
export async function requestJsonCompletion({
  messages,
  maxTokens,
  responseFormat,
  timeoutMs,
}: {
  messages: ChatMessage[];
  maxTokens: number;
  responseFormat: object;
  timeoutMs: number;
}): Promise<unknown | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_TEXT_MODEL?.trim() || DEFAULT_MODEL,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
        response_format: responseFormat,
        provider: {
          data_collection: "deny",
          zdr: true,
          require_parameters: true,
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;

    const provider = providerResponseSchema.safeParse(await response.json());
    if (!provider.success) return null;

    try {
      return JSON.parse(provider.data.choices[0].message.content) as unknown;
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
