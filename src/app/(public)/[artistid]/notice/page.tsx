import type { Metadata } from "next";
import ArtistNoticePage from "@/public/pages/[artistid]/notice/page";
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
  const pageType = pageTypeLabel("notices", locale);
  return createPageMetadata(
    artistName ? `${artistName} ${pageType}` : pageType,
  );
}

export default ArtistNoticePage;
