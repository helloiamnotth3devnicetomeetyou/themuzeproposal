import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import {
  normalizeSocialLinks,
  type SocialLink,
} from "@/admin/components/content/SocialLinksField";

export type Member = {
  id: string;
  name: string;
  eng_name: string | null;
  name_ko: string | null;
  name_en: string | null;
  name_ja: string | null;
  slug: string;
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
  social_links: unknown;
  sort_order: number;
};

export type MemberDraft = {
  id: string | null;
  name: string;
  engName: string;
  jaName: string;
  roleKo: string;
  roleEn: string;
  roleJa: string;
  birth: string;
  mbti: string;
  imageUrl: string;
  color: string;
  bioKo: string;
  bioEn: string;
  bioJa: string;
  socialLinks: SocialLink[];
};

export type MemberTab = "basic" | "profile" | "content" | "social" | "gallery";

export const EMPTY_MEMBER: MemberDraft = {
  id: null,
  name: "",
  engName: "",
  jaName: "",
  roleKo: "",
  roleEn: "",
  roleJa: "",
  birth: "",
  mbti: "",
  imageUrl: "",
  color: BRAND_PINK_HEX,
  bioKo: "",
  bioEn: "",
  bioJa: "",
  socialLinks: [],
};

export const memberTabs: WorkbenchTab<MemberTab>[] = [
  { id: "basic", label: "기본 정보" },
  { id: "profile", label: "프로필" },
  { id: "content", label: "소개" },
  { id: "social", label: "공식 계정" },
  { id: "gallery", label: "갤러리" },
];

export const toMemberSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const memberToDraft = (member: Member): MemberDraft => ({
  id: member.id,
  name: member.name_ko || member.name || "",
  engName: member.name_en || member.eng_name || "",
  jaName: member.name_ja || "",
  roleKo: member.role_ko || "",
  roleEn: member.role_en || "",
  roleJa: member.role_ja || "",
  birth: member.birth || "",
  mbti: member.mbti || "",
  imageUrl: member.image_url || "",
  color: member.color || BRAND_PINK_HEX,
  bioKo: member.bio_ko || "",
  bioEn: member.bio_en || "",
  bioJa: member.bio_ja || "",
  socialLinks: normalizeSocialLinks(member.social_links),
});
