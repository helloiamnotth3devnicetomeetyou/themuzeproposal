import type { Metadata } from "next";
import ArtistPage from "@/public/pages/[artistid]/artist/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { getServerLocale } from "@/core/i18n/server";
import { displayName, getPublicArtistTitle, pageTypeLabel } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  const locale = await getServerLocale();
  return createPageMetadata(displayName(await getPublicArtistTitle(artistid), locale) || pageTypeLabel("artist", locale));
}

export default ArtistPage;
