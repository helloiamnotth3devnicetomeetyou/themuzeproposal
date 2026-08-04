import { createPrivatePageMetadata } from "@/core/seo/metadata";
import { CampaignListAdmin } from "@/admin/pages/auditions/CampaignAdminClient";

export const metadata = createPrivatePageMetadata("Audition Campaigns");
export default function Page() { return <CampaignListAdmin />; }
