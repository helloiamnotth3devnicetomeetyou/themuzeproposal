// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DiscographyAlbum } from "@/public/features/discography/types";

vi.mock("next/image", () => ({ default: () => <span /> }));
vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({
    t: { discography: { tabs: { concept: "Concept", intro: "Intro", members: "Members" }, noDescription: "", musicVideo: "MV" } },
  }),
}));
vi.mock("./MemberGallery", () => ({ MemberGallery: () => null }));
vi.mock("./TrackList", () => ({ TrackList: () => null }));
vi.mock("./TrackPlayer", () => ({ TrackPlayer: () => null }));

import { AlbumDetails } from "./AlbumDetails";

const album = (spotify?: string): DiscographyAlbum => ({
  id: "album", title: "Album", titles: { ko: "Album", en: "Album", ja: "Album" },
  type: "Single", releaseDate: "2026-01-01", cover: "/cover.jpg", color: "#fff",
  desc: { ko: "", en: "", ja: "" }, tracks: [], links: { spotify },
});

function renderAlbum(spotify?: string) {
  render(<AlbumDetails activeTab="concept" album={album(spotify)} currentTrackIndex={-1} hoveredDisc={null} isPlaying={false} locale="ko" progress={0} time={{ current: "0:00", total: "0:00" }} onNextTrack={vi.fn()} onPlayTrack={vi.fn()} onPreviousTrack={vi.fn()} onSeek={vi.fn()} onTabChange={vi.fn()} onTogglePlay={vi.fn()} />);
}

describe("AlbumDetails", () => {
  it("hides Spotify when the album has no Spotify URL", () => {
    renderAlbum();
    expect(screen.queryByRole("link", { name: /album on spotify/i })).toBeNull();
  });

  it("renders Spotify with its URL", () => {
    renderAlbum("https://open.spotify.com/album/id");
    expect(screen.getByRole("link", { name: /album on spotify/i })).toHaveAttribute("href", "https://open.spotify.com/album/id");
  });
});
