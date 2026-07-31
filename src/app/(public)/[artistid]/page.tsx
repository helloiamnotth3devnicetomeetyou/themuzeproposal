import { redirect } from "next/navigation";

/**
 * /[artistid] 루트 접근 시 /[artistid]/artist 로 리다이렉트.
 * 예: /rescene → /rescene/artist
 */
export default async function ArtistRootPage({
  params,
}: {
  params: Promise<{ artistid: string }>;
}) {
  const { artistid } = await params;
  redirect(`/${artistid}/artist`);
}
