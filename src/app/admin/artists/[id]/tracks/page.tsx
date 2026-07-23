import { redirect } from "next/navigation";

export default async function LegacyTracksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/artists/${id}/discography?tab=tracks`);
}
