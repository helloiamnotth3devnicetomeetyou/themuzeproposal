import { redirect } from "next/navigation";

export default function CampaignFormPage({ campaignId }: { campaignId: string }) {
  return redirect(`/audition?campaign=${encodeURIComponent(campaignId)}`);
}
