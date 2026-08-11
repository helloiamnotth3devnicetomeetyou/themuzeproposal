import { Cake, CalendarPlus, Disc3, PartyPopper, Radio } from "lucide-react";
import type { IconType } from "react-icons";
import type { WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import { SCHEDULE_CATEGORY_COLORS } from "@/core/utils/design-tokens";

export type Category = "show" | "release" | "anniversary" | "event" | "etc";
export type ScheduleTab = "calendar" | "details" | "publish";

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
  is_published: boolean;
  sort_order: number;
};

export type ScheduleDraft = {
  id: string;
  eventDate: string;
  startTime: string;
  category: Category;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionJa: string;
  location: string;
  locationEn: string;
  locationJa: string;
  linkUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

export const CATEGORY: Record<
  Category,
  { label: string; icon: IconType; color: string }
> = {
  show: {
    label: "방송 / 공연",
    icon: Radio,
    color: SCHEDULE_CATEGORY_COLORS.show,
  },
  release: {
    label: "발매",
    icon: Disc3,
    color: SCHEDULE_CATEGORY_COLORS.release,
  },
  anniversary: {
    label: "기념일",
    icon: Cake,
    color: SCHEDULE_CATEGORY_COLORS.anniversary,
  },
  event: {
    label: "이벤트",
    icon: PartyPopper,
    color: SCHEDULE_CATEGORY_COLORS.event,
  },
  etc: {
    label: "기타",
    icon: CalendarPlus,
    color: SCHEDULE_CATEGORY_COLORS.etc,
  },
};

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export const scheduleTabs: WorkbenchTab<ScheduleTab>[] = [
  { id: "calendar", label: "월간 달력" },
  { id: "details", label: "일정 정보" },
  { id: "publish", label: "공개 설정" },
];

export const toDateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const today = () => toDateKey(new Date());

export const monthFromDateKey = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const emptyScheduleDraft = (
  eventDate = today(),
): ScheduleDraft => ({
  id: "",
  eventDate,
  startTime: "",
  category: "event",
  titleKo: "",
  titleEn: "",
  titleJa: "",
  descriptionKo: "",
  descriptionEn: "",
  descriptionJa: "",
  location: "",
  locationEn: "",
  locationJa: "",
  linkUrl: "",
  isPublished: false,
  sortOrder: 0,
});

export const scheduleToDraft = (row: ScheduleRow): ScheduleDraft => ({
  id: row.id,
  eventDate: row.event_date,
  startTime: row.start_time?.slice(0, 5) || "",
  category: row.category,
  titleKo: row.title_ko,
  titleEn: row.title_en || "",
  titleJa: row.title_ja || "",
  descriptionKo: row.description_ko || "",
  descriptionEn: row.description_en || "",
  descriptionJa: row.description_ja || "",
  location: row.location_ko || row.location || "",
  locationEn: row.location_en || "",
  locationJa: row.location_ja || "",
  linkUrl: row.link_url || "",
  isPublished: row.is_published,
  sortOrder: row.sort_order,
});

export const duplicateScheduleDraft = (draft: ScheduleDraft): ScheduleDraft => ({
  ...draft,
  id: "",
  isPublished: false,
});
