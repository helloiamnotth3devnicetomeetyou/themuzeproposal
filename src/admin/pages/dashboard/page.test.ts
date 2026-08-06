import { describe, expect, it } from "vitest";
import { latestRecentItems, type RecentItem } from "./dashboard-model";

describe("latestRecentItems", () => {
  it("엔티티 종류와 관계없이 최신 다섯 건만 반환한다", () => {
    const item = (id: string, updatedAt: string): RecentItem => ({ id, updatedAt, kind: "notice", title: id, detail: "", href: "/admin/notices" });
    const result = latestRecentItems([[item("1", "2026-08-01")], [item("6", "2026-08-06"), item("4", "2026-08-04")], [item("3", "2026-08-03"), item("5", "2026-08-05"), item("2", "2026-08-02")]]);
    expect(result.map(({ id }) => id)).toEqual(["6", "5", "4", "3", "2"]);
  });
});
