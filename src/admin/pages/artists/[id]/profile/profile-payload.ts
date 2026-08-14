import { sanitizeRichText } from "@/core/utils/rich-text";
import { toArtistSlug, type ProfileDraft } from "./profile-editor-model";

export function toArtistProfilePayload(draft: ProfileDraft) {
  return {
    slug: toArtistSlug(draft.engName),
    name: draft.name,
    eng_name: draft.engName,
    name_ko: draft.name,
    name_en: draft.engName,
    name_ja: draft.jaName || null,
    type: draft.type,
    debut_date: draft.debutDate || null,
    image_url: draft.imageUrl || null,
    logo_url: draft.logoUrl || null,
    color: draft.color.toUpperCase(),
    description_ko: sanitizeRichText(draft.descKo),
    description_en: sanitizeRichText(draft.descEn),
    description_ja: sanitizeRichText(draft.descJa),
    social_links: draft.socialLinks,
    is_active: draft.isActive,
  };
}
