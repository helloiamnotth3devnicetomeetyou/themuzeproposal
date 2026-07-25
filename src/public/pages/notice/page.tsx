import NoticeBoard from "@/components/NoticeBoard";
import { loadPublicNotices } from "@/features/notices/server";

export default async function Notice() {
  const { data, loadFailed } = await loadPublicNotices();
  return <main><NoticeBoard initialData={data} loadFailed={loadFailed} /></main>;
}