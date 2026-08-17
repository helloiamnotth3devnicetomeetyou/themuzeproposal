import type { Metadata } from "next";
import ArtistSchedulePage from "@/public/pages/[artistid]/schedule/page";
import { loadPublicArtistSchedule } from "@/public/features/schedule/server";
import { createPageMetadata } from "@/core/seo/metadata";
import { getServerLocale } from "@/core/i18n/server";
import {
  displayName,
  getPublicArtistTitle,
  pageTypeLabel,
} from "@/public/features/seo/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistid: string }>;
}): Promise<Metadata> {
  const { artistid } = await params;
  const locale = await getServerLocale();
  const artistName = displayName(await getPublicArtistTitle(artistid), locale);
  const pageType = pageTypeLabel("schedule", locale);
  return createPageMetadata(
    artistName ? `${artistName} ${pageType}` : pageType,
  );
}

export default async function ArtistScheduleRoute({
  params,
}: {
  params: Promise<{ artistid: string }>;
}) {
  const { artistid } = await params;
  const { data, loadFailed } = await loadPublicArtistSchedule(artistid);
  return (
    <ArtistSchedulePage initialData={data} initialLoadFailed={loadFailed} />
  );
}
