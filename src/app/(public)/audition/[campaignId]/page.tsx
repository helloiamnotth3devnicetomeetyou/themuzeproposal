import { createPageMetadata } from "@/core/seo/metadata";
import CampaignFormPage from "@/public/pages/audition/CampaignFormPage";

export const metadata = createPageMetadata("Audition Application");
export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) {
  return <CampaignFormPage campaignId={(await params).campaignId} />;
}
