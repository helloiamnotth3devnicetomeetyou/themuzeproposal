import type { Metadata } from "next";
import NoticeDetailPage from "@/public/pages/notice/[id]/page";
import { createPageMetadata } from "@/core/seo/metadata";
import { getServerLocale } from "@/core/i18n/server";
import { getPublicNoticeTitle, noticeDisplayTitle, pageTypeLabel } from "@/public/features/seo/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = await getServerLocale();
  return createPageMetadata(noticeDisplayTitle(await getPublicNoticeTitle(id), locale) || pageTypeLabel("notice", locale));
}

export default NoticeDetailPage;
