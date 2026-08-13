import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));

import { daysUntil } from "./page";

describe("daysUntil", () => {
  it("uses the supplied local date instead of a stale mount-time date", () => {
    expect(daysUntil("2026-08-14", new Date(2026, 7, 13, 23, 59))).toBe(1);
    expect(daysUntil("2026-08-14", new Date(2026, 7, 14, 0, 1))).toBe(0);
  });
});
