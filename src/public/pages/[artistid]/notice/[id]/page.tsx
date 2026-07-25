import NoticeDetail from "@/components/NoticeDetail";
import { loadPublicNotice } from "@/features/notices/server";

export default async function ArtistNoticeDetailPage({ params }: { params: Promise<{ artistid: string; id: string }> }) {
  const { artistid, id } = await params;
  const { data, loadFailed } = await loadPublicNotice(id, artistid);
  return <main><NoticeDetail noticeId={id} artistSlug={artistid} initialData={data} loadFailed={loadFailed} /></main>;
}