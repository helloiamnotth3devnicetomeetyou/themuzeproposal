export type RecentItem = { id: string; kind: "album" | "member" | "schedule" | "notice"; title: string; detail: string; updatedAt: string; href: string; imageUrl?: string | null; published?: boolean };

export const latestRecentItems = (groups: RecentItem[][]) =>
  groups.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
