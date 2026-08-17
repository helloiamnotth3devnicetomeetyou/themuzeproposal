import type { Metadata } from "next";
import ArtistSceneExperience from "@/public/pages/[artistid]/artist/ArtistSceneExperience";
import { getArtistSceneData } from "@/public/features/artists/server";
import { createPageMetadata } from "@/core/seo/metadata";
import { getServerLocale } from "@/core/i18n/server";
import {
  displayName,
  getPublicArtistTitle,
  getPublicMemberTitle,
} from "@/public/features/seo/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistid: string; id: string }>;
}): Promise<Metadata> {
  const { artistid, id } = await params;
  const locale = await getServerLocale();
  const member = await getPublicMemberTitle(artistid, id);
  const memberName = displayName(member, locale);
  const artistName =
    displayName(member?.artist ?? null, locale) ||
    displayName(await getPublicArtistTitle(artistid), locale);
  return createPageMetadata(
    memberName && artistName
      ? `${memberName} — ${artistName}`
      : memberName || artistName || "Artist",
  );
}

export default async function ArtistMemberPage({
  params,
}: {
  params: Promise<{ artistid: string; id: string }>;
}) {
  const { artistid, id } = await params;
  return (
    <ArtistSceneExperience
      artistSlug={artistid}
      initialMemberSlug={id}
      initialData={await getArtistSceneData(artistid)}
    />
  );
}
