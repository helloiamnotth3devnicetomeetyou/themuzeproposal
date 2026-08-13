export type Category = "show" | "release" | "anniversary" | "event" | "etc";

export type ScheduleRow = {
  id: string;
  event_date: string;
  start_time: string | null;
  category: Category;
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
};

export type PublicScheduleData = {
  artistColor: string | null;
  events: ScheduleRow[];
};
