import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import {
  campaignDescription,
  type AuditionCampaign,
  type AuditionFormField,
} from "@/core/auditions/types";
import { FieldPreview } from "./CampaignAdminShared";

type Props = {
  campaign: AuditionCampaign;
  fields: AuditionFormField[];
  language: AdminLanguage;
};

export default function CampaignBuilderPreview({
  campaign,
  fields,
  language,
}: Props) {
  return (
    <aside className="audition-builder-preview">
      <div className="audition-preview-toolbar">
        <b>지원서 미리보기</b>
      </div>
      <div className="audition-preview-paper">
        <header>
          <h2>{campaign.title}</h2>
          <p>{campaignDescription(campaign, language)}</p>
        </header>
        <div className="audition-preview-fields">
          {fields.map((field) => (
            <div className="audition-preview-select" key={field.id}>
              <FieldPreview field={field} locale={language} />
            </div>
          ))}
        </div>
        <button type="button" disabled>
          제출 내용 검토
        </button>
      </div>
    </aside>
  );
}
