export const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  twitter: "X",
  tiktok: "TikTok",
  spotify: "Spotify",
  weverse: "Weverse",
  facebook: "Facebook",
  soundcloud: "SoundCloud",
  "apple-music": "Apple Music",
  homepage: "Official website",
  other: "Official link",
};

const SOCIAL_HOSTS: Array<[platform: string, hosts: string[]]> = [
  ["instagram", ["instagram.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["x", ["x.com", "twitter.com"]],
  ["tiktok", ["tiktok.com"]],
  ["spotify", ["spotify.com"]],
  ["weverse", ["weverse.io", "weverse.com"]],
  ["facebook", ["facebook.com", "fb.com"]],
  ["soundcloud", ["soundcloud.com"]],
  ["apple-music", ["music.apple.com"]],
];

/** Returns the platform represented by an HTTP(S) URL, or "other" for unknown links. */
export function detectSocialPlatform(value: string): string {
  try {
    const { hostname, protocol } = new URL(value.trim());
    if (protocol !== "http:" && protocol !== "https:") return "other";
    const host = hostname.toLowerCase().replace(/^www\./, "");
    return SOCIAL_HOSTS.find(([, hosts]) => hosts.some((known) => host === known || host.endsWith(`.${known}`)))?.[0] || "other";
  } catch {
    return "other";
  }
}
