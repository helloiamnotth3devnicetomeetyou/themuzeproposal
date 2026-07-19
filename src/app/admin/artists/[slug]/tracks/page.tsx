import { redirect } from "next/navigation";

export default async function LegacyTracksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/admin/artists/${slug}/discography?tab=tracks`);
}
