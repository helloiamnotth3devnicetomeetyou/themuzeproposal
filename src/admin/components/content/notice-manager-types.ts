export type Notice = {
  id: string;
  title_ko: string;
  title_en: string | null;
  title_ja: string | null;
  content_ko: string | null;
  content_en: string | null;
  content_ja: string | null;
  category_ko: string;
  category_en: string | null;
  category_ja: string | null;
  date: string;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export type NoticeTab = "content" | "publish";
export type NoticeFilter = "all" | "published" | "draft";
export type NoticeLanguage = "ko" | "en" | "ja";
