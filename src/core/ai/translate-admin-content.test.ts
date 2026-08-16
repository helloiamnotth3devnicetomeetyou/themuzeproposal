import { afterEach, describe, expect, it, vi } from "vitest";
import { translateAdminContent } from "./translate-admin-content";

describe("translateAdminContent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("instructs the model to preserve every paragraph and line break", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("AI_TEXT_MODEL", "test-model");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  translations: [
                    {
                      key: "content",
                      en: "<p>First line<br>Second line</p><p>Third paragraph</p>",
                      ja: null,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const translation = await translateAdminContent("notice", [
      {
        key: "content",
        label: "Content",
        format: "richtext",
        source: "<p>First line<br>Second line</p><p>Third paragraph</p>",
        targetLocales: ["en"],
      },
    ]);

    expect(translation).toEqual([
      {
        key: "content",
        en: "<p>First line<br>Second line</p><p>Third paragraph</p>",
        ja: null,
      },
    ]);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.model).toBe("test-model");
    expect(request.messages[0].content).toContain(
      "Preserve every paragraph, line break, and list item",
    );
  });
});
