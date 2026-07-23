import NoticeBoard from "@/components/NoticeBoard";

export default async function ArtistNotice({ params }: { params: Promise<{ artistid: string }> }) {
  const { artistid } = await params;
  return <main><NoticeBoard artistSlug={artistid} /></main>;
}
