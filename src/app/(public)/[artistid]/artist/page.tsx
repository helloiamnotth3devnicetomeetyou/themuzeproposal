import type { Metadata } from "next";
import ArtistPage from "@/public/pages/[artistid]/artist/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { displayName, getPublicArtistTitle } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  return createPageMetadata(displayName(await getPublicArtistTitle(artistid)) || "Artist");
}

export default ArtistPage;
