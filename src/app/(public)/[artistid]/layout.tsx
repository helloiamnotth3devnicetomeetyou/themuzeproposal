import { notFound } from "next/navigation";
import { getPublicArtistTitle } from "@/public/features/seo/server";

export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ artistid: string }>;
}) {
  const { artistid } = await params;
  const artist = await getPublicArtistTitle(artistid);

  if (!artist) {
    notFound();
  }

  return <>{children}</>;
}
