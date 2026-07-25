import NoticeDetail from "@/components/NoticeDetail";
import { loadPublicNotice } from "@/features/notices/server";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, loadFailed } = await loadPublicNotice(id);
  return <main><NoticeDetail noticeId={id} initialData={data} loadFailed={loadFailed} /></main>;
}