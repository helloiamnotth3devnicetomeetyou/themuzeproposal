// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider, usePlayer, type PlayerTrack } from "./PlayerProvider";

function makeTrack(
  id: string,
  title: string,
  albumTrackIndex: number,
): PlayerTrack {
  return {
    id,
    title,
    audioUrl: `/audio/${id}.mp3`,
    albumId: "album-1",
    albumTitle: "Album",
    albumCover: "/cover.jpg",
    albumColor: "#111111",
    artistSlug: "artist",
    artistName: "Artist",
    albumTrackIndex,
  };
}

function makeQueue() {
  return [makeTrack("first", "First", 0), makeTrack("second", "Second", 1)];
}

function Controls({
  queue,
  route = "route-a",
}: {
  queue: PlayerTrack[];
  route?: string;
}) {
  const player = usePlayer();
  return (
    <div>
      <span data-testid="route">{route}</span>
      <span data-testid="track">{player.currentTrack?.title ?? "none"}</span>
      <span data-testid="queue">
        {player.queue.map((track) => track.id).join(",")}
      </span>
      <span data-testid="index">{player.currentTrackIndex}</span>
      <span data-testid="playing">{String(player.isPlaying)}</span>
      <span data-testid="time">{player.currentTime}</span>
      <span data-testid="duration">{player.duration}</span>
      <span data-testid="progress">{player.progress}</span>
      <button
        type="button"
        aria-label="play first"
        onClick={() => player.playTrack(queue, 0, 0)}
      />
      <button
        type="button"
        aria-label="play second"
        onClick={() => player.playTrack(queue, 1, 0)}
      />
      <button type="button" aria-label="toggle" onClick={player.togglePlay} />
      <button type="button" aria-label="next" onClick={player.nextTrack} />
      <button
        type="button"
        aria-label="previous"
        onClick={player.previousTrack}
      />
      <button
        type="button"
        aria-label="seek halfway"
        onClick={() => player.seek(50)}
      />
    </div>
  );
}

function getAudio(container: HTMLElement) {
  const audio = container.querySelector("audio");
  if (!audio) throw new Error("PlayerProvider did not render an audio element");
  return audio;
}

function setAudioMetrics(
  audio: HTMLAudioElement,
  duration: number,
  currentTime = 0,
) {
  let time = currentTime;
  Object.defineProperty(audio, "duration", {
    configurable: true,
    value: duration,
  });
  Object.defineProperty(audio, "currentTime", {
    configurable: true,
    get: () => time,
    set: (value: number) => {
      time = Number(value);
    },
  });
}

async function playFirst(queue: PlayerTrack[]) {
  fireEvent.click(screen.getByRole("button", { name: "play first" }));
  await waitFor(() =>
    expect(screen.getByTestId("track")).toHaveTextContent("First"),
  );
  expect(screen.getByTestId("queue")).toHaveTextContent("first,second");
  expect(queue[0].title).toBe("First");
}

describe("PlayerProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(
      () => undefined,
    );
  });

  it("owns one audio element and loads an explicit queue", async () => {
    const queue = makeQueue();
    const { container } = render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );

    expect(container.querySelectorAll("audio")).toHaveLength(1);
    await playFirst(queue);

    expect(getAudio(container).getAttribute("src")).toContain(
      "/audio/first.mp3",
    );
    expect(screen.getByTestId("index")).toHaveTextContent("0");
    expect(screen.getByTestId("playing")).toHaveTextContent("true");
  });

  it("pauses without losing the current track", async () => {
    const queue = makeQueue();
    render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );
    await playFirst(queue);

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(() =>
      expect(screen.getByTestId("playing")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("track")).toHaveTextContent("First");
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("seeks the shared audio and updates progress", async () => {
    const queue = makeQueue();
    const { container } = render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );
    await playFirst(queue);
    const audio = getAudio(container);
    setAudioMetrics(audio, 120);
    fireEvent.loadedMetadata(audio);
    await waitFor(() =>
      expect(screen.getByTestId("duration")).toHaveTextContent("120"),
    );

    fireEvent.click(screen.getByRole("button", { name: "seek halfway" }));
    await waitFor(() =>
      expect(screen.getByTestId("time")).toHaveTextContent("60"),
    );
    expect(audio.currentTime).toBe(60);
    expect(Number(screen.getByTestId("progress").textContent)).toBeCloseTo(50);
  });

  it("moves through the queue with next and previous", async () => {
    const queue = makeQueue();
    render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );
    await playFirst(queue);

    fireEvent.click(screen.getByRole("button", { name: "next" }));
    await waitFor(() =>
      expect(screen.getByTestId("track")).toHaveTextContent("Second"),
    );
    expect(screen.getByTestId("index")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    await waitFor(() =>
      expect(screen.getByTestId("track")).toHaveTextContent("First"),
    );
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("stops on the last track when audio ends", async () => {
    const queue = makeQueue();
    const { container } = render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );
    await playFirst(queue);

    fireEvent.ended(getAudio(container));
    await waitFor(() =>
      expect(screen.getByTestId("track")).toHaveTextContent("Second"),
    );
    expect(screen.getByTestId("playing")).toHaveTextContent("true");

    const audio = getAudio(container);
    setAudioMetrics(audio, 120, 120);
    fireEvent.ended(audio);
    await waitFor(() =>
      expect(screen.getByTestId("playing")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("track")).toHaveTextContent("Second");
    expect(screen.getByTestId("index")).toHaveTextContent("1");
    expect(screen.getByTestId("time")).toHaveTextContent("0");
    expect(audio.currentTime).toBe(0);
  });

  it("does not reload a relative source when pausing", async () => {
    const queue = makeQueue();
    const load = vi.mocked(HTMLMediaElement.prototype.load);
    const { container } = render(
      <PlayerProvider>
        <Controls queue={queue} />
      </PlayerProvider>,
    );
    await playFirst(queue);
    const loadedCalls = load.mock.calls.length;
    const source = getAudio(container).getAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(() =>
      expect(screen.getByTestId("playing")).toHaveTextContent("false"),
    );

    expect(load).toHaveBeenCalledTimes(loadedCalls);
    expect(getAudio(container).getAttribute("src")).toBe(source);
  });

  it("keeps the queue when a route child unmounts and remounts", async () => {
    const queue = makeQueue();
    const { container, rerender } = render(
      <PlayerProvider>
        <Controls key="route-a" queue={queue} route="route-a" />
      </PlayerProvider>,
    );
    await playFirst(queue);
    const audio = getAudio(container);

    rerender(
      <PlayerProvider>
        <Controls key="route-b" queue={queue} route="route-b" />
      </PlayerProvider>,
    );

    expect(screen.getByTestId("route")).toHaveTextContent("route-b");
    expect(screen.getByTestId("track")).toHaveTextContent("First");
    expect(screen.getByTestId("queue")).toHaveTextContent("first,second");
    expect(getAudio(container)).toBe(audio);
    expect(container.querySelectorAll("audio")).toHaveLength(1);
  });
});
