import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const MAX_DIMENSION = 1080;
const ENCODE_TIMEOUT_MS = 50_000;

/** Normalizes an uploaded hero clip to a consistent, high-quality H.264 MP4 so
 * playback quality doesn't depend on whatever bitrate/resolution the admin's
 * source file happened to have. Audio is dropped since hero videos always
 * render muted. Returns null if ffmpeg fails or isn't available. */
export async function transcodeHeroVideo(input: Uint8Array): Promise<Uint8Array | null> {
  if (!ffmpegPath) return null;

  const dir = await mkdtemp(join(tmpdir(), "hero-video-"));
  const inputPath = join(dir, `${randomUUID()}.mp4`);
  const outputPath = join(dir, `${randomUUID()}-out.mp4`);

  try {
    await writeFile(inputPath, input);
    await new Promise<void>((resolve, reject) => {
      const child = execFile(ffmpegPath as string, [
        "-y",
        "-i", inputPath,
        "-vf", `scale='min(${MAX_DIMENSION * 2},iw)':'min(${MAX_DIMENSION},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        "-c:v", "libx264",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "20",
        "-movflags", "+faststart",
        "-an",
        outputPath,
      ], { timeout: ENCODE_TIMEOUT_MS }, (error) => (error ? reject(error) : resolve()));
      child.on("error", reject);
    });
    return new Uint8Array(await readFile(outputPath));
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
