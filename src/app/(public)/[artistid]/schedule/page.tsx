import type { Metadata } from "next";
import ArtistSchedulePage from "@/public/pages/[artistid]/schedule/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { displayName, getPublicArtistTitle } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  const artistName = displayName(await getPublicArtistTitle(artistid));
  return createPageMetadata(artistName ? `${artistName} Schedule` : "Schedule");
}

export default ArtistSchedulePage;
