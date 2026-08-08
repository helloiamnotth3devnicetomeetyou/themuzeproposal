import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtistSceneExperience from "@/public/pages/[artistid]/artist/ArtistSceneExperience";
import { getArtistSceneData } from "@/public/pages/[artistid]/artist/artist-scene-server";
import { createPageMetadata } from "@/core/seo/metadata";
import { getServerLocale } from "@/core/i18n/server";
import { displayName, getPublicArtistTitle, pageTypeLabel } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ artistid: string }> }): Promise<Metadata> {
  const { artistid } = await params;
  const locale = await getServerLocale();
  return createPageMetadata(displayName(await getPublicArtistTitle(artistid), locale) || pageTypeLabel("artist", locale));
}

export default async function ArtistPage({ params }: { params: Promise<{ artistid: string }> }) {
  const { artistid } = await params;
  const initialData = await getArtistSceneData(artistid);
  if (!initialData) notFound();
  return <ArtistSceneExperience artistSlug={artistid} initialData={initialData} />;
}
