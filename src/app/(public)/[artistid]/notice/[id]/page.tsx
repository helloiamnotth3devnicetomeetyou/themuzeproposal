import type { Metadata } from "next";
import ArtistNoticeDetailPage from "@/public/pages/[artistid]/notice/[id]/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { getPublicNoticeTitle, noticeDisplayTitle } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return createPageMetadata(noticeDisplayTitle(await getPublicNoticeTitle(id)) || "Notice");
}

export default ArtistNoticeDetailPage;
