import { redirect } from "next/navigation";

export default async function ArtistMemberRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/rescene/artist/${id}`);
}
