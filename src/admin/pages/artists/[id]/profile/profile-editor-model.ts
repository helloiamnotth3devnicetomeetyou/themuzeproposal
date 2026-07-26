import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import type { SocialLink } from "@/admin/components/content/SocialLinksField";

export type ProfileTab = "basic" | "visual" | "content" | "social" | "scenes" | "gallery" | "publish";

export type ProfileDraft = {
  name: string;
  engName: string;
  type: string;
  debutDate: string;
  imageUrl: string;
  logoUrl: string;
  color: string;
  descKo: string;
  descEn: string;
  descJa: string;
  socialLinks: SocialLink[];
  isActive: boolean;
};

export const EMPTY_PROFILE: ProfileDraft = {
  name: "",
  engName: "",
  type: "group",
  debutDate: "",
  imageUrl: "",
  logoUrl: "",
  color: BRAND_PINK_HEX,
  descKo: "",
  descEn: "",
  descJa: "",
  socialLinks: [],
  isActive: true,
};

export const profileTabs: WorkbenchTab<ProfileTab>[] = [
  { id: "basic", label: "기본 정보" },
  { id: "visual", label: "비주얼" },
  { id: "content", label: "소개" },
  { id: "social", label: "공식 계정" },
  { id: "scenes", label: "인터랙티브 장면" },
  { id: "gallery", label: "갤러리" },
  { id: "publish", label: "공개 설정" },
];

export const toArtistSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
