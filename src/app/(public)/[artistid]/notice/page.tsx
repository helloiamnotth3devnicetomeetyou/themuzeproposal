import type { Metadata } from "next";
import ArtistNoticePage from "@/public/pages/[artistid]/notice/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { displayName, getPublicArtistTitle } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  const artistName = displayName(await getPublicArtistTitle(artistid));
  return createPageMetadata(artistName ? `${artistName} Notices` : "Notices");
}

export default ArtistNoticePage;
