import NoticeDetail from "@/components/NoticeDetail";

export default async function ArtistNoticeDetailPage({ params }: { params: Promise<{ artistid: string; id: string }> }) {
  const { artistid, id } = await params;
  return <main><NoticeDetail noticeId={id} artistSlug={artistid} /></main>;
}
