import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { SubmissionReviewAdmin } from "@/admin/pages/auditions/CampaignAdminClient";

export const metadata = createPrivatePageMetadata("Audition Submissions");
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SubmissionReviewAdmin campaignId={(await params).id} />;
}
