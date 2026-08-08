export type RecentItem = { id: string; kind: "album" | "member" | "schedule" | "notice"; title: string; detail: string; updatedAt: string; href: string; imageUrl?: string | null; published?: boolean };

export const latestRecentItems = (groups: RecentItem[][], limit = 10) =>
  groups.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
