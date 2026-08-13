import { describe, expect, it } from "vitest";
import { spotifyAlbumHref, spotifyAlbumId } from "./spotify";

describe("Spotify album links", () => {
  it("accepts an album id or a full Spotify album URL", () => {
    expect(spotifyAlbumHref("abc123")).toBe(
      "https://open.spotify.com/album/abc123",
    );
    expect(
      spotifyAlbumId("https://open.spotify.com/album/abc123?si=test"),
    ).toBe("abc123");
  });

  it("rejects non-album and untrusted URLs", () => {
    expect(
      spotifyAlbumHref("https://example.com/album/abc123"),
    ).toBeUndefined();
    expect(
      spotifyAlbumHref("https://open.spotify.com/artist/abc123"),
    ).toBeUndefined();
  });
});
