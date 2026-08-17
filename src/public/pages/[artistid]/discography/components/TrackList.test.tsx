import { describe, it, expect } from "vitest";
// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { DiscographyAlbum } from "@/public/features/discography/types";

vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({
    t: { discography: { musicVideo: "뮤직비디오" } },
    locale: "ko",
  }),
}));
vi.mock("@/core/http/safe-href", () => ({
  safeHref: (value: string | undefined) => value ?? null,
}));

import { vi } from "vitest";
import { TrackList } from "./TrackList";

const makeAlbum = (): DiscographyAlbum => ({
  id: "album-1",
  title: "lip bomb",
  titles: { ko: "립밤", en: "lip bomb", ja: "lip bomb" },
  type: "Mini Album",
  releaseDate: "2025-11-01",
  cover: "/cover.jpg",
  color: "#ff3d7f",
  desc: { ko: "설명", en: "Desc", ja: "説明" },
  tracks: [
    {
      id: "track-1",
      title: "Superstar",
      titles: { ko: "슈퍼스타", en: "Superstar", ja: "スーパースター" },
      isTitle: true,
      spotifyUrl: "https://open.spotify.com/track/abc",
      youtubeUrl: undefined,
      audioUrl: "https://cdn.themuze.kr/audio.mp3",
      videoUrl: "https://youtube.com/watch?v=mv",
    },
    {
      id: "track-2",
      title: "Runway",
      titles: { ko: "런웨이", en: "Runway", ja: "ランウェイ" },
      isTitle: false,
      spotifyUrl: undefined,
      youtubeUrl: undefined,
      audioUrl: undefined,
      videoUrl: undefined,
    },
  ],
});

describe("TrackList", () => {
  it("renders all tracks", () => {
    const onPlayTrack = vi.fn();
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={onPlayTrack}
      />,
    );
    expect(screen.getByText("Superstar")).toBeInTheDocument();
    expect(screen.getByText("Runway")).toBeInTheDocument();
  });

  it("shows TITLE badge for title tracks", () => {
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={vi.fn()}
      />,
    );
    expect(screen.getByText("TITLE")).toBeInTheDocument();
  });

  it("calls onPlayTrack with the correct index when a track button is clicked", () => {
    const onPlayTrack = vi.fn();
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={-1}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={onPlayTrack}
      />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // second track = Runway
    expect(onPlayTrack).toHaveBeenCalledWith(1);
  });

  it("shows spotify link only when spotifyUrl is present", () => {
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={vi.fn()}
      />,
    );
    const spotifyLink = screen.getByRole("link", {
      name: /superstar spotify/i,
    });
    expect(spotifyLink).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/abc",
    );
  });

  it("shows MV link only when videoUrl is present", () => {
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: /superstar 뮤직비디오/i }),
    ).toBeInTheDocument();
  });

  it("does not show spotify/MV links for tracks without URLs", () => {
    render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={vi.fn()}
      />,
    );
    expect(screen.queryByRole("link", { name: /runway spotify/i })).toBeNull();
    expect(
      screen.queryByRole("link", { name: /runway 뮤직비디오/i }),
    ).toBeNull();
  });

  it("shows playing animation bars when track is active and playing", () => {
    const { container } = render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={true}
        onPlayTrack={vi.fn()}
      />,
    );
    // The animated bars are spans inside a flex container
    const animatedBars = container.querySelectorAll(".animate-bounce");
    expect(animatedBars.length).toBe(3);
  });

  it("does not show playing animation when not playing", () => {
    const { container } = render(
      <TrackList
        album={makeAlbum()}
        currentTrackIndex={0}
        hoveredDisc={null}
        isPlaying={false}
        onPlayTrack={vi.fn()}
      />,
    );
    expect(container.querySelectorAll(".animate-bounce").length).toBe(0);
  });
});
