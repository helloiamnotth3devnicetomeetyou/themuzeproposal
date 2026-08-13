import NoticeBoard from "@/public/components/notices/NoticeBoard";
import { loadPublicNotices } from "@/public/features/notices/server";

export default async function ArtistNotice({
  params,
}: {
  params: Promise<{ artistid: string }>;
}) {
  const { artistid } = await params;
  const { data, loadFailed } = await loadPublicNotices(artistid);
  return (
    <main>
      <NoticeBoard
        artistSlug={artistid}
        initialData={data}
        loadFailed={loadFailed}
      />
    </main>
  );
}
