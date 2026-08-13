// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/core/providers/LocaleContext";
import CampaignFormClient from "./CampaignFormClient";

const campaign = {
  id: "campaign-1",
  title: "Audition",
  description: "",
  description_i18n: {},
  is_active: true,
  starts_at: null,
  ends_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const fields = [
  {
    id: "name",
    campaign_id: campaign.id,
    field_key: "name",
    label_i18n: { en: "Name" },
    help_text: null,
    field_type: "short_text" as const,
    options: [],
    required: true,
    max_length: 255,
    max_file_size_mb: null,
    accepted_file_types: [],
    sort_order: 0,
    is_active: true,
    is_primary_label: true,
  },
  {
    id: "photo",
    campaign_id: campaign.id,
    field_key: "photo",
    label_i18n: { en: "Photo" },
    help_text: null,
    field_type: "file" as const,
    options: [],
    required: false,
    max_length: null,
    max_file_size_mb: 20,
    accepted_file_types: ["image/png"],
    sort_order: 1,
    is_active: true,
    is_primary_label: false,
  },
];

describe("CampaignFormClient", () => {
  it("restores answers but not selected files from a session draft", () => {
    sessionStorage.setItem(
      "themuze:audition-draft:campaign-1:new",
      JSON.stringify({
        owner: "user@example.com",
        values: { name: "Saved applicant" },
        removedFiles: [],
      }),
    );

    render(
      <LocaleProvider initialLocale="en">
        <CampaignFormClient
          campaign={campaign}
          fields={fields}
          initialSubmission={null}
          userEmail="user@example.com"
          onSaved={() => undefined}
          onViewMine={() => undefined}
        />
      </LocaleProvider>,
    );

    expect(document.getElementById("audition-name")).toHaveValue(
      "Saved applicant",
    );
    expect(document.getElementById("audition-photo")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("attachments again");
  });
});
