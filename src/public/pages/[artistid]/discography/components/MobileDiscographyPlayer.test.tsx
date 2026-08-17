// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DiscographyAlbum } from "@/public/features/discography/types";

vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({
    t: {
      discography: {
        nextAlbum: "Next album",
        previousAlbum: "Previous album",
        play: "Play",
        pause: "Pause",
        nowPlaying: "Now playing",
        progress: "Playback position",
        noDescription: "No description",
        tabs: { concept: "Concept", members: "Members" },
      },
    },
  }),
}));
vi.mock("@/core/http/safe-href", () => ({
  safeHref: (value?: string) => value || null,
}));
vi.mock("./MemberGallery", () => ({
  MemberGallery: () => <div>Member gallery</div>,
}));
vi.mock("./TrackList", () => ({ TrackList: () => <div>Track list</div> }));
vi.mock("./TrackPlayer", () => ({
  TrackPlayer: () => <div>Track player</div>,
}));

import { MobileDiscographyPlayer } from "./MobileDiscographyPlayer";

const album = (id: string, title: string): DiscographyAlbum => ({
  id,
  title,
  titles: { ko: title, en: title, ja: title },
  type: "Mini Album",
  releaseDate: "2026-01-01",
  cover: "/cover.jpg",
  color: "#fc6fcf",
  desc: { ko: "소개", en: "Intro", ja: "紹介" },
  tracks: [
    {
      id: `${id}-track`,
      title: "Track",
      titles: { ko: "Track", en: "Track", ja: "Track" },
      isTitle: true,
      audioUrl: "/track.mp3",
    },
  ],
});

const albums = [album("one", "One"), album("two", "Two")];

function renderPlayer(
  overrides: Partial<Parameters<typeof MobileDiscographyPlayer>[0]> = {},
) {
  const props: Parameters<typeof MobileDiscographyPlayer>[0] = {
    album: albums[0],
    albumIndex: 0,
    albums,
    artistName: "Artist",
    currentTrackIndex: 0,
    gallery: [],
    hoveredDisc: null,
    isPlaying: false,
    locale: "ko",
    members: [],
    progress: 0,
    time: { current: "0:00", total: "3:00" },
    view: "album",
    onIntentAlbum: vi.fn(),
    onNextTrack: vi.fn(),
    onPlayTrack: vi.fn(),
    onPreviousTrack: vi.fn(),
    onSeek: vi.fn(),
    onSelectAlbum: vi.fn(),
    onTogglePlay: vi.fn(),
    onViewChange: vi.fn(),
    ...overrides,
  };
  render(<MobileDiscographyPlayer {...props} />);
  return props;
}

describe("MobileDiscographyPlayer", () => {
  it("changes only one album after a horizontal cover swipe", () => {
    const props = renderPlayer();
    const cover = screen.getByRole("img", { name: "One" });
    fireEvent.touchStart(cover, { touches: [{ clientX: 300, clientY: 100 }] });
    fireEvent.touchEnd(cover, {
      changedTouches: [{ clientX: 200, clientY: 104 }],
    });
    expect(props.onIntentAlbum).toHaveBeenCalledWith(1);
    expect(props.onSelectAlbum).toHaveBeenCalledWith(1);
  });

  it("does not change albums during a vertical scroll gesture", () => {
    const props = renderPlayer();
    const cover = screen.getByRole("img", { name: "One" });
    fireEvent.touchStart(cover, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(cover, {
      changedTouches: [{ clientX: 190, clientY: 200 }],
    });
    expect(props.onSelectAlbum).not.toHaveBeenCalled();
  });

  it("pre-renders the neighboring cover for a continuous slide", () => {
    renderPlayer();
    expect(document.querySelector('img[loading="eager"]')).toBeInTheDocument();
  });

  it("selects albums from the mobile scrubber", () => {
    const props = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Show Two" }));
    expect(props.onSelectAlbum).toHaveBeenCalledWith(1);
  });

  it("keeps track controls behind the tracks tab", () => {
    const props = renderPlayer();
    fireEvent.click(screen.getByRole("tab", { name: /tracks/i }));
    expect(props.onViewChange).toHaveBeenCalledWith("tracks");
  });

  it("keeps the play button beside the album title", () => {
    const props = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(props.onTogglePlay).toHaveBeenCalledOnce();
  });

  it("prefers the album typo logo over its text title", () => {
    renderPlayer({ album: { ...albums[0], typoLogoUrl: "/one-logo.svg" } });
    expect(
      screen
        .getAllByLabelText("One")
        .some((element) => element.style.maskImage.includes("one-logo.svg")),
    ).toBe(true);
  });
});
