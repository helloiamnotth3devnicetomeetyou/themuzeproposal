import NoticeDetail from "@/public/components/notices/NoticeDetail";
import { loadPublicNotice } from "@/public/features/notices/server";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, loadFailed } = await loadPublicNotice(id);
  return <main><NoticeDetail noticeId={id} initialData={data} loadFailed={loadFailed} /></main>;
}