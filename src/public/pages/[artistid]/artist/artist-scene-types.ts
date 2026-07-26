import type { ArtistScene } from "@/core/utils/artist-scenes";

export type Artist = {
  id: string; slug: string; name: string; eng_name: string | null; image_url: string | null;
  name_ko: string | null; name_en: string | null; name_ja: string | null;
  logo_url: string | null; color: string | null; description_ko: string | null;
  description_en: string | null; description_ja: string | null;
};

export type Member = {
  id: string; slug: string; name: string; eng_name: string | null;
  name_ko: string | null; name_en: string | null; name_ja: string | null;
  role_ko: string | null; role_en: string | null; role_ja: string | null;
  birth: string | null; mbti: string | null; image_url: string | null; color: string | null;
  bio_ko: string | null; bio_en: string | null; bio_ja: string | null; sort_order: number;
};

export type ArtistSceneData = { artist: Artist; members: Member[]; scenes: ArtistScene[] };
export type SceneCopy = { select: string; scene: string; close: string; previous: string; next: string; discography: string; profile: string; groupProfile: string; expand: string; collapse: string };

export function getEnglishFirstMemberName(member: Member) {
  return member.name_en?.trim()
    || member.eng_name?.trim()
    || member.name.trim()
    || member.name_ko?.trim()
    || member.name_ja?.trim()
    || "";
}
