import NoticeBoard from "@/public/components/notices/NoticeBoard";
import { loadPublicNotices } from "@/public/features/notices/server";

export default async function Notice() {
  const { data, loadFailed } = await loadPublicNotices();
  return <main><NoticeBoard initialData={data} loadFailed={loadFailed} /></main>;
}