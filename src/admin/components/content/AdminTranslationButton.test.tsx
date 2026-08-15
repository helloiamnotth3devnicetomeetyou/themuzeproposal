// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminTranslationButton from "./AdminTranslationButton";

describe("AdminTranslationButton", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests and applies only blank target locales", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          translations: [{ key: "description", en: null, ja: "日本語" }],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onApply = vi.fn();

    render(
      <AdminTranslationButton
        documentKind="artist"
        fields={[
          {
            key: "description",
            label: "아티스트 소개",
            format: "plain",
            ko: "한국어",
            en: "Existing English",
            ja: "",
          },
        ]}
        onApply={onApply}
        onError={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "EN·JP 자동 번역" }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        description: { ja: "日本語" },
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).fields[0]).toMatchObject(
      {
        targetLocales: ["ja"],
      },
    );
  });
});
