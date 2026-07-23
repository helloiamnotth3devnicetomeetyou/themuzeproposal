import NoticeDetail from "@/components/NoticeDetail";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main><NoticeDetail noticeId={id} /></main>;
}
