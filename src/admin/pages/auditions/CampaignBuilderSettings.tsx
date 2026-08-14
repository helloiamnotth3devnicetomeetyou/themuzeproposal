import FormField from "@/admin/components/content/FormField";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import type { AuditionCampaign } from "@/core/auditions/types";
import { localDateTime } from "./CampaignAdminShared";

type Props = {
  campaign: AuditionCampaign;
  language: AdminLanguage;
  onLanguageChange: (language: AdminLanguage) => void;
  onPatchCampaign: (patch: Partial<AuditionCampaign>) => void;
  onSetActive: (active: boolean) => Promise<void>;
};

export default function CampaignBuilderSettings({
  campaign,
  language,
  onLanguageChange,
  onPatchCampaign,
  onSetActive,
}: Props) {
  return (
    <>
      <AdminLanguageTabs
        activeLang={language}
        onChange={onLanguageChange}
        values={{
          ko: campaign.description_i18n?.ko ?? campaign.description,
          en: campaign.description_i18n?.en,
          ja: campaign.description_i18n?.ja,
        }}
      />
      <div className="audition-builder-settings">
        <label>
          캠페인 제목
          <input
            className="admin-input"
            value={campaign.title}
            onChange={(event) =>
              onPatchCampaign({ title: event.target.value })
            }
          />
        </label>
        <div className="audition-campaign-description">
          <FormField
            activeLang={language}
            label="소개"
            type="textarea"
            valueKo={campaign.description_i18n?.ko ?? campaign.description}
            valueEn={campaign.description_i18n?.en ?? ""}
            valueJa={campaign.description_i18n?.ja ?? ""}
            onChangeKo={(value) =>
              onPatchCampaign({
                description: value,
                description_i18n: {
                  ...campaign.description_i18n,
                  ko: value,
                },
              })
            }
            onChangeEn={(value) =>
              onPatchCampaign({
                description_i18n: {
                  ...campaign.description_i18n,
                  en: value,
                },
              })
            }
            onChangeJa={(value) =>
              onPatchCampaign({
                description_i18n: {
                  ...campaign.description_i18n,
                  ja: value,
                },
              })
            }
          />
        </div>
        <label>
          시작일
          <input
            className="admin-input"
            type="datetime-local"
            value={localDateTime(campaign.starts_at)}
            onChange={(event) =>
              onPatchCampaign({ starts_at: event.target.value })
            }
          />
        </label>
        <label>
          마감일
          <input
            className="admin-input"
            type="datetime-local"
            value={localDateTime(campaign.ends_at)}
            onChange={(event) =>
              onPatchCampaign({ ends_at: event.target.value })
            }
          />
        </label>
        <label className="audition-builder-check">
          <input
            type="checkbox"
            checked={campaign.is_active}
            onChange={(event) =>
              void onSetActive(event.target.checked)
            }
          />{" "}
          공개 활성화
        </label>
      </div>
    </>
  );
}
