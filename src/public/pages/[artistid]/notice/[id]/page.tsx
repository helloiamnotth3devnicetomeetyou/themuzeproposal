import NoticeDetail from "@/public/components/notices/NoticeDetail";
import { loadPublicNotice, loadPublicNoticeNavigation } from "@/public/features/notices/server";

export default async function ArtistNoticeDetailPage({ params }: { params: Promise<{ artistid: string; id: string }> }) {
  const { artistid, id } = await params;
  const [{ data, loadFailed }, { data: navigation }] = await Promise.all([loadPublicNotice(id, artistid), loadPublicNoticeNavigation(id, artistid)]);
  return <main><NoticeDetail noticeId={id} artistSlug={artistid} initialData={data} initialNavigation={navigation} loadFailed={loadFailed} /></main>;
}
