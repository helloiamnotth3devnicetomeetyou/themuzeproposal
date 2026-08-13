// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ArtistSceneData } from "./artist-scene-types";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));

import { useArtistSceneData } from "./useArtistSceneData";

function data(slug: string): ArtistSceneData {
  return {
    artist: {
      id: slug, slug, name: slug, eng_name: null, image_url: null,
      name_ko: null, name_en: null, name_ja: null, logo_url: null,
      color: null, description_ko: null, description_en: null, description_ja: null,
    },
    members: [], scenes: [],
  };
}

describe("useArtistSceneData", () => {
  it("replaces initial data when the artist changes", async () => {
    const { result, rerender } = renderHook(
      ({ artistSlug, initialData }) =>
        useArtistSceneData({ artistSlug, initialData, profilePreview: null, memberPreview: null }),
      { initialProps: { artistSlug: "a", initialData: data("a") } },
    );

    rerender({ artistSlug: "b", initialData: data("b") });
    await waitFor(() => expect(result.current.data?.artist.slug).toBe("b"));
  });
});
