import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { CampaignBuilderAdmin } from "@/admin/pages/auditions/CampaignAdminClient";

export const metadata = createPrivatePageMetadata("Audition Form Builder");
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CampaignBuilderAdmin campaignId={(await params).id} />; }
