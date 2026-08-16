import { isUuid } from "@/core/utils/uuid";

export const PREVIEW_VERSION = 1 as const;
export const PREVIEW_TTL_MS = 30 * 60 * 1000;
export const PREVIEW_SESSION_COOKIE = "themuze-preview-session";
const PREVIEW_STORAGE_PREFIX = "themuze:admin-preview:";

export type PreviewKind =
  | "artist-profile"
  | "artist-member"
  | "album"
  | "notice"
  | "schedule"
  | "site-settings";

type PreviewSocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
};

type ArtistProfilePreviewPayload = {
  artist: {
    id: string;
    slug: string;
    name: string;
    eng_name: string;
    name_ko: string;
    name_en: string;
    name_ja: string | null;
    type: string;
    debut_date: string | null;
    image_url: string | null;
    logo_url: string | null;
    color: string | null;
    description_ko: string | null;
    description_en: string | null;
    description_ja: string | null;
    social_links: PreviewSocialLink[];
    is_active: boolean;
  };
};

type ArtistMemberPreviewPayload = {
  artist: {
    id: string;
    slug: string;
    name: string;
  };
  member: {
    id: string;
    slug: string;
    name: string;
    eng_name: string | null;
    name_ko: string;
    name_en: string | null;
    name_ja: string | null;
    role_ko: string | null;
    role_en: string | null;
    role_ja: string | null;
    birth: string | null;
    mbti: string | null;
    image_url: string | null;
    color: string | null;
    bio_ko: string | null;
    bio_en: string | null;
    bio_ja: string | null;
    sort_order: number;
  };
};

export type AlbumPreviewPayload = {
  artist: {
    id: string;
    slug: string;
    name: string;
  };
  album: {
    id: string;
    title: string;
    title_ko: string;
    title_en: string;
    title_ja: string;
    type: string;
    release_date: string;
    cover_url: string;
    hero_image_url: string;
    typo_logo_url: string;
    color: string;
    description_ko: string;
    description_en: string;
    description_ja: string;
    spotify_id: string;
    youtube_url: string;
    sort_order: number;
    tracks: Array<{
      id: string;
      title: string;
      title_ko: string;
      title_en: string;
      title_ja: string;
      is_title: boolean;
      spotify_url: string;
      youtube_url: string;
      audio_url: string;
      music_video_url: string;
    }>;
  };
};

type NoticePreviewPayload = {
  scope: {
    name: string;
    artistSlug?: string;
  };
  notice: {
    id: string;
    title: LocalizedPreviewText;
    content: LocalizedPreviewText;
    category: LocalizedPreviewText;
    date: string;
  };
};

type LocalizedPreviewText = { ko: string; en: string; ja: string };

type SchedulePreviewPayload = {
  artist: {
    id: string;
    slug: string;
    color: string | null;
  };
  schedule: {
    id: string;
    event_date: string;
    start_time: string | null;
    category: "show" | "release" | "anniversary" | "event" | "etc";
    title_ko: string;
    title_en: string | null;
    title_ja: string | null;
    description_ko: string | null;
    description_en: string | null;
    description_ja: string | null;
    location: string | null;
    location_ko: string | null;
    location_en: string | null;
    location_ja: string | null;
    link_url: string | null;
    sort_order: number;
  };
};

export type SiteSettingsPreviewPayload = {
  company: {
    name_ko: string;
    name_en: string;
    name_ja: string;
    address_ko: string;
    address_en: string;
    address_ja: string;
    email: string;
  };
  history: Array<{
    id: string;
    date: string;
    event_ko: string;
    event_en: string;
    event_ja: string;
  }>;
  footer: {
    copyright: string;
  };
  social: PreviewSocialLink[];
};

export type PreviewPayloadByKind = {
  "artist-profile": ArtistProfilePreviewPayload;
  "artist-member": ArtistMemberPreviewPayload;
  album: AlbumPreviewPayload;
  notice: NoticePreviewPayload;
  schedule: SchedulePreviewPayload;
  "site-settings": SiteSettingsPreviewPayload;
};

type PreviewEnvelopeBase<K extends PreviewKind> = {
  version: typeof PREVIEW_VERSION;
  token: string;
  kind: K;
  targetPath: string;
  revision: number;
  updatedAt: number;
  expiresAt: number;
  payload: PreviewPayloadByKind[K];
};

export type PreviewEnvelope = {
  [K in PreviewKind]: PreviewEnvelopeBase<K>;
}[PreviewKind];

const PREVIEW_KINDS = new Set<PreviewKind>([
  "artist-profile",
  "artist-member",
  "album",
  "notice",
  "schedule",
  "site-settings",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasStrings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => isString(value[key]));

function isPayloadForKind(kind: PreviewKind, payload: unknown): boolean {
  if (!isRecord(payload)) return false;

  if (kind === "artist-profile") {
    const artist = payload.artist;
    return (
      isRecord(artist) &&
      hasStrings(artist, [
        "id",
        "slug",
        "name",
        "eng_name",
        "name_ko",
        "name_en",
        "type",
      ]) &&
      isNullableString(artist.name_ja) &&
      isNullableString(artist.debut_date) &&
      isNullableString(artist.image_url) &&
      isNullableString(artist.logo_url) &&
      isNullableString(artist.color) &&
      isNullableString(artist.description_ko) &&
      isNullableString(artist.description_en) &&
      isNullableString(artist.description_ja) &&
      Array.isArray(artist.social_links) &&
      typeof artist.is_active === "boolean"
    );
  }

  if (kind === "artist-member") {
    const artist = payload.artist;
    const member = payload.member;
    return (
      isRecord(artist) &&
      hasStrings(artist, ["id", "slug", "name"]) &&
      isRecord(member) &&
      hasStrings(member, [
        "id",
        "slug",
        "name",
        "name_ko",
        "name_en",
        "name_ja",
      ]) &&
      isNullableString(member.eng_name) &&
      isNullableString(member.image_url) &&
      isFiniteNumber(member.sort_order)
    );
  }

  if (kind === "album") {
    const artist = payload.artist;
    const album = payload.album;
    return (
      isRecord(artist) &&
      hasStrings(artist, ["id", "slug", "name"]) &&
      isRecord(album) &&
      hasStrings(album, [
        "id",
        "title",
        "title_ko",
        "title_en",
        "title_ja",
        "type",
        "release_date",
        "cover_url",
        "color",
      ]) &&
      Array.isArray(album.tracks) &&
      album.tracks.every(
        (track) =>
          isRecord(track) &&
          hasStrings(track, [
            "id",
            "title",
            "title_ko",
            "title_en",
            "title_ja",
            "spotify_url",
            "youtube_url",
            "audio_url",
            "music_video_url",
          ]) &&
          typeof track.is_title === "boolean",
      )
    );
  }

  if (kind === "notice") {
    const scope = payload.scope;
    const notice = payload.notice;
    return (
      isRecord(scope) &&
      isString(scope.name) &&
      (scope.artistSlug === undefined || isString(scope.artistSlug)) &&
      isRecord(notice) &&
      hasStrings(notice, ["id", "date"]) &&
      isRecord(notice.title) &&
      isRecord(notice.content) &&
      isRecord(notice.category) &&
      hasStrings(notice.title, ["ko", "en", "ja"]) &&
      hasStrings(notice.content, ["ko", "en", "ja"]) &&
      hasStrings(notice.category, ["ko", "en", "ja"])
    );
  }

  if (kind === "schedule") {
    const artist = payload.artist;
    const schedule = payload.schedule;
    return (
      isRecord(artist) &&
      hasStrings(artist, ["id", "slug"]) &&
      isNullableString(artist.color) &&
      isRecord(schedule) &&
      hasStrings(schedule, [
        "id",
        "event_date",
        "category",
        "title_ko",
        "location_ko",
        "location_en",
        "location_ja",
      ]) &&
      isFiniteNumber(schedule.sort_order)
    );
  }

  const company = payload.company;
  const history = payload.history;
  const footer = payload.footer;
  return (
    isRecord(company) &&
    hasStrings(company, [
      "name_ko",
      "name_en",
      "name_ja",
      "address_ko",
      "address_en",
      "address_ja",
      "email",
    ]) &&
    Array.isArray(history) &&
    history.every(
      (item) =>
        isRecord(item) &&
        hasStrings(item, ["id", "date", "event_ko", "event_en", "event_ja"]),
    ) &&
    isRecord(footer) &&
    isString(footer.copyright) &&
    Array.isArray(payload.social)
  );
}

export const previewStorageKey = (token: string) =>
  `${PREVIEW_STORAGE_PREFIX}${token}`;

export function clearPreviewStorage() {
  if (typeof window === "undefined") return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(PREVIEW_STORAGE_PREFIX))
        window.localStorage.removeItem(key);
    }
  } catch {
    // Storage access is optional; authentication sign-out must still proceed.
  }
}

export function isPreviewToken(value: string): boolean {
  return isUuid(value);
}

export function parsePreviewEnvelope(
  value: string,
  expectedToken?: string,
): PreviewEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== PREVIEW_VERSION) return null;
    if (typeof parsed.token !== "string" || !isPreviewToken(parsed.token))
      return null;
    if (expectedToken && parsed.token !== expectedToken) return null;
    if (
      typeof parsed.kind !== "string" ||
      !PREVIEW_KINDS.has(parsed.kind as PreviewKind)
    )
      return null;
    if (
      typeof parsed.targetPath !== "string" ||
      !parsed.targetPath.startsWith("/") ||
      parsed.targetPath.startsWith("//")
    )
      return null;
    if (
      typeof parsed.revision !== "number" ||
      !Number.isFinite(parsed.revision)
    )
      return null;
    if (
      typeof parsed.updatedAt !== "number" ||
      !Number.isFinite(parsed.updatedAt)
    )
      return null;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now())
      return null;
    if (!isPayloadForKind(parsed.kind as PreviewKind, parsed.payload))
      return null;
    return parsed as PreviewEnvelope;
  } catch {
    return null;
  }
}
