import NoticeDetail from "@/public/components/notices/NoticeDetail";
import { loadPublicNotice, loadPublicNoticeNavigation } from "@/public/features/notices/server";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data, loadFailed }, { data: navigation }] = await Promise.all([loadPublicNotice(id), loadPublicNoticeNavigation(id)]);
  return <main><NoticeDetail noticeId={id} initialData={data} initialNavigation={navigation} loadFailed={loadFailed} /></main>;
}
