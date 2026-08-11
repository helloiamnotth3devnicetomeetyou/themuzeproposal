"use client";

import { Link, Plus, Trash2 } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import { detectSocialPlatform, SOCIAL_ICONS, SOCIAL_LABELS } from "@/core/content/social-icons";

export type SocialLink = { id: string; platform: string; label: string; url: string };

const PLATFORM_OPTIONS = [
  ["instagram", "Instagram"], ["youtube", "YouTube"], ["x", "X"], ["tiktok", "TikTok"],
  ["spotify", "Spotify"], ["weverse", "Weverse"], ["facebook", "Facebook"], ["soundcloud", "SoundCloud"],
  ["apple-music", "Apple Music"], ["homepage", "홈페이지"], ["other", "기타"],
] as const;

const isValidLink = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
};

const createLink = (): SocialLink => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
  platform: "other",
  label: "",
  url: "",
});

export function normalizeSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<SocialLink>;
    const url = typeof candidate.url === "string" ? candidate.url : "";
    const detected = detectSocialPlatform(url);
    return [{
      id: typeof candidate.id === "string" && candidate.id ? candidate.id : `social-${index}`,
      platform: detected !== "other" ? detected : (typeof candidate.platform === "string" && candidate.platform ? candidate.platform : "other"),
      label: typeof candidate.label === "string" ? candidate.label : "",
      url,
    }];
  });
}

export function hasInvalidSocialLinks(value: SocialLink[]) {
  return value.some((link) => !link.platform || !isValidLink(link.url) || (link.platform === "other" && !link.label.trim()));
}

export default function SocialLinksField({ value, onChange }: { value: SocialLink[]; onChange: (value: SocialLink[]) => void }) {
  const patchLink = (id: string, patch: Partial<SocialLink>) => onChange(value.map((link) => link.id === id ? { ...link, ...patch } : link));

  return (
    <div className="social-link-editor">
      <div className="social-link-toolbar">
        <span>등록된 계정 <b>{value.length}</b></span>
        <button type="button" onClick={() => onChange([...value, createLink()])}><Plus aria-hidden="true" />계정 추가</button>
      </div>
      {!value.length && (
        <button type="button" className="social-link-empty" onClick={() => onChange([createLink()])}>
          <Plus aria-hidden="true" /><span>공식 계정이 아직 없습니다.</span><b>첫 계정 추가</b>
        </button>
      )}
      <div className="social-link-list">
        {value.map((link, index) => {
          const platform = detectSocialPlatform(link.url) !== "other" ? detectSocialPlatform(link.url) : link.platform;
          const PlatformIcon = SOCIAL_ICONS[platform] || Link;
          const invalid = Boolean(link.url) && !isValidLink(link.url);
          return (
            <div className={`social-link-row ${platform === "other" ? "has-custom-label" : ""}`} key={link.id}>
              <span className="social-link-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="social-link-mark" aria-hidden="true"><PlatformIcon /></span>
              <div className="music-field social-link-platform">
                <span>플랫폼</span>
                <CustomSelect ariaLabel="소셜 플랫폼" value={platform} onChange={(nextPlatform) => patchLink(link.id, { platform: nextPlatform })} options={PLATFORM_OPTIONS.map(([optionValue, label]) => ({ value: optionValue, label }))} />
              </div>
              {platform === "other" && <label className="music-field">
                <span>링크 이름</span>
                <input className="admin-input" value={link.label} onChange={(event) => patchLink(link.id, { label: event.target.value })} placeholder="플랫폼과 계정 이름" />
              </label>}
              <label className={`music-field social-link-address ${invalid ? "is-invalid" : ""}`}>
                <span>계정 링크 <b>*</b></span>
                <input type="url" className="admin-input" value={link.url} onChange={(event) => {
                  const url = event.target.value;
                  const detected = detectSocialPlatform(url);
                  patchLink(link.id, { url, ...(detected !== "other" ? { platform: detected } : {}) });
                }} placeholder="https://..." />
                {invalid && <small>http:// 또는 https://로 시작하는 링크를 입력하세요.</small>}
              </label>
              <button type="button" className="social-link-remove" aria-label={`${SOCIAL_LABELS[platform] || "소셜"} 계정 삭제`} onClick={() => onChange(value.filter((item) => item.id !== link.id))}><Trash2 aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
