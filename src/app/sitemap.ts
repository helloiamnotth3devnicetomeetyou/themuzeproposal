import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getSiteUrl } from "@/core/config/public-env";

export const revalidate = 3600;

type ArtistRow = { id: string; slug: string };
type NoticeRow = { id: string; artist_id: string | null; date: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/notice`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/audition`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const { url, anonKey } = getPublicSupabaseConfig();
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [artistResult, noticeResult] = await Promise.all([
      client.from("artists").select("id,slug").eq("is_active", true),
      client
        .from("notices")
        .select("id,artist_id,date")
        .eq("is_published", true),
    ]);

    if (artistResult.error || noticeResult.error) return entries;

    const artists = (artistResult.data ?? []) as ArtistRow[];
    const artistSlugs = new Map(
      artists.map((artist) => [artist.id, artist.slug]),
    );

    artists.forEach(({ slug }) => {
      entries.push(
        {
          url: `${siteUrl}/${slug}/artist`,
          changeFrequency: "weekly",
          priority: 0.9,
        },
        {
          url: `${siteUrl}/${slug}/discography`,
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${siteUrl}/${slug}/notice`,
          changeFrequency: "daily",
          priority: 0.7,
        },
        {
          url: `${siteUrl}/${slug}/schedule`,
          changeFrequency: "daily",
          priority: 0.7,
        },
      );
    });

    ((noticeResult.data ?? []) as NoticeRow[]).forEach((notice) => {
      const artistSlug = notice.artist_id
        ? artistSlugs.get(notice.artist_id)
        : null;
      const path = artistSlug
        ? `/${artistSlug}/notice/${notice.id}`
        : `/notice/${notice.id}`;
      entries.push({
        url: `${siteUrl}${path}`,
        lastModified: notice.date ? new Date(notice.date) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });
  } catch {
    // Static routes remain available if the content API is temporarily down.
  }

  return entries;
}
