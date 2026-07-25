import type { Metadata } from "next";
import ArtistDiscographyPage from "@/public/pages/[artistid]/discography/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { displayName, getPublicArtistTitle } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  const artistName = displayName(await getPublicArtistTitle(artistid));
  return createPageMetadata(artistName ? `${artistName} Discography` : "Discography");
}

export default ArtistDiscographyPage;
