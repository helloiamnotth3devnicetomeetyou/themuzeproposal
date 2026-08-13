// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/supabase/client", () => ({ supabase: {} }));
vi.mock("next/navigation", () => ({ useParams: () => ({ artistid: "artist" }) }));
vi.mock("@/core/preview/PreviewProvider", () => ({
  usePreviewPayload: () => null,
}));
vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({
    locale: "en",
    t: {
      schedule: new Proxy(
        { calendarLabel: () => "", dayLabel: () => "" },
        { get: (target, key) => target[key as keyof typeof target] ?? "" },
      ),
    },
  }),
}));

import ArtistSchedulePage, { daysUntil } from "./page";

describe("daysUntil", () => {
  it("uses the supplied local date instead of a stale mount-time date", () => {
    expect(daysUntil("2026-08-14", new Date(2026, 7, 13, 23, 59))).toBe(1);
    expect(daysUntil("2026-08-14", new Date(2026, 7, 14, 0, 1))).toBe(0);
  });
});

it("replaces server data when navigating to another artist", async () => {
  const event = (id: string, title: string) => ({
    id,
    event_date: "2026-08-14",
    start_time: null,
    category: "event" as const,
    title_ko: title,
    title_en: title,
    title_ja: title,
    description_ko: null,
    description_en: null,
    description_ja: null,
    location: null,
    location_ko: null,
    location_en: null,
    location_ja: null,
    link_url: null,
  });
  const { rerender } = render(
    createElement(ArtistSchedulePage, {
      initialData: { artistColor: "#111111", events: [event("a", "Artist A")] },
    }),
  );

  rerender(
    createElement(ArtistSchedulePage, {
      initialData: { artistColor: "#222222", events: [event("b", "Artist B")] },
    }),
  );

  await waitFor(() => expect(screen.getByText("Artist B")).toBeInTheDocument());
  expect(screen.queryByText("Artist A")).not.toBeInTheDocument();
});
