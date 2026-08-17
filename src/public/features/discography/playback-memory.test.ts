// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readPlaybackMemory,
  savePlaybackMemory,
  requestedAlbumId,
  syncAlbumQuery,
} from "./playback-memory";

describe("playback-memory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(readPlaybackMemory("rescene")).toBeNull();
  });

  it("saves and reads back a memory object", () => {
    const memory = { albumId: "album-1", trackIndex: 2, currentTime: 45.5 };
    savePlaybackMemory("rescene", memory);
    const result = readPlaybackMemory("rescene");
    expect(result).toEqual(memory);
  });

  it("isolates memory by artist slug", () => {
    savePlaybackMemory("rescene", {
      albumId: "a1",
      trackIndex: 0,
      currentTime: 0,
    });
    savePlaybackMemory("other-artist", {
      albumId: "b1",
      trackIndex: 3,
      currentTime: 120,
    });

    const resceneMemory = readPlaybackMemory("rescene");
    const otherMemory = readPlaybackMemory("other-artist");

    expect(resceneMemory?.albumId).toBe("a1");
    expect(otherMemory?.albumId).toBe("b1");
  });

  it("returns null when stored value is corrupted JSON", () => {
    localStorage.setItem("themuze:discography:rescene", "not-valid-json{{{");
    expect(readPlaybackMemory("rescene")).toBeNull();
    expect(localStorage.getItem("themuze:discography:rescene")).toBeNull();
  });

  it.each([
    null,
    [],
    { albumId: "album-1", trackIndex: 1.5, currentTime: 0 },
    { albumId: "album-1", trackIndex: -1, currentTime: 0 },
    { albumId: "album-1", trackIndex: 0, currentTime: -1 },
    { albumId: "album-1", trackIndex: 0, currentTime: "10" },
  ])("clears a stored value with an invalid shape: %j", (value) => {
    localStorage.setItem("themuze:discography:rescene", JSON.stringify(value));
    expect(readPlaybackMemory("rescene")).toBeNull();
    expect(localStorage.getItem("themuze:discography:rescene")).toBeNull();
  });

  it("handles localStorage failure gracefully on save", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() =>
      savePlaybackMemory("rescene", {
        albumId: "a",
        trackIndex: 0,
        currentTime: 0,
      }),
    ).not.toThrow();
  });

  it("requestedAlbumId returns album param from URL", () => {
    Object.defineProperty(window, "location", {
      value: { search: "?album=lp-bomb" },
      writable: true,
    });
    expect(requestedAlbumId()).toBe("lp-bomb");
  });

  it("requestedAlbumId returns null when no album param", () => {
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    });
    expect(requestedAlbumId()).toBeNull();
  });

  it("syncAlbumQuery calls replaceState with updated URL", () => {
    const replaceState = vi.fn();
    Object.defineProperty(window, "history", {
      value: { replaceState },
      writable: true,
    });
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost:3000/rescene/discography", search: "" },
      writable: true,
    });
    syncAlbumQuery("glow-up");
    expect(replaceState).toHaveBeenCalledOnce();
    const calledUrl = replaceState.mock.calls[0][2] as URL;
    expect(calledUrl.searchParams.get("album")).toBe("glow-up");
  });
});
