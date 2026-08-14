// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlbumEditorDraft } from "@/core/utils/music-editor";
import DiscographyContextRail from "./DiscographyContextRail";

const album = (id: string, title: string): AlbumEditorDraft => ({
  id,
  artist_id: "artist",
  title,
  title_ko: title,
  title_en: "",
  title_ja: "",
  type: "Single",
  release_date: "",
  cover_url: "",
  hero_image_url: "",
  typo_logo_url: "",
  color: "#000000",
  spotify_id: "",
  youtube_url: "",
  description_ko: "",
  description_en: "",
  description_ja: "",
  is_published: false,
  published_at: null,
  sort_order: 0,
  tracks: [],
});

describe("DiscographyContextRail mobile sorting", () => {
  it("moves an album with accessible up and down controls", () => {
    const albums = [album("a", "첫 앨범"), album("b", "둘째 앨범")];
    const onReorderAlbum = vi.fn();

    render(
      <DiscographyContextRail
        albums={albums}
        draft={albums[0]}
        visibleAlbums={albums}
        search=""
        filter="all"
        sorting
        sortDirty={false}
        onAddAlbum={() => {}}
        onSearchChange={() => {}}
        onFilterChange={() => {}}
        onToggleSorting={() => {}}
        onDragAlbum={() => {}}
        onReorderAlbum={onReorderAlbum}
        onSaveOrder={() => {}}
        onSelectAlbum={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "첫 앨범 위로 이동" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "둘째 앨범 위로 이동" }),
    );
    expect(onReorderAlbum).toHaveBeenCalledWith("a", "b");
  });
});
