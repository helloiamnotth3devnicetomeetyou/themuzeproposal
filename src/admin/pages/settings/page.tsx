"use client";

import { Settings2 } from "lucide-react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import PreviewButton from "@/admin/components/content/PreviewButton";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import AdminLanguageTabs from "@/admin/components/content/AdminLanguageTabs";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { settingsTabs, type SettingsTab } from "./settings-editor-model";
import SettingsEditorContent from "./SettingsEditorContent";
import SettingsRail from "./SettingsRail";
import { useSettingsEditor } from "./useSettingsEditor";

export default function SettingsAdmin({
  canManageAdminAccounts = false,
}: {
  canManageAdminAccounts?: boolean;
}) {
  const editor = useSettingsEditor(canManageAdminAccounts);
  const {
    loading,
    saving,
    tab,
    setTab,
    company,
    history,
    historyLanguage,
    setHistoryLanguage,
    footer,
    social,
    business,
    avatarDirty,
    snapshot,
    error,
    setError,
    toast,
    isSuperAdmin,
    draft,
    settingsDirty,
    dirty,
    recovery,
    restoreBackup,
    discardBackup,
    nestedDrafts,
    openPreview,
    handleSave,
  } = editor;

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const companyReady = Boolean(
    company.email.trim() ||
    company.address_ko.trim() ||
    company.address_en.trim() ||
    company.address_ja.trim(),
  );
  const footerReady = Boolean(footer.copyright.trim());
  const businessReady = Boolean(business.pressKitUrl || business.profilePdfUrl);
  const businessComplete = Boolean(
    business.pressKitUrl && business.profilePdfUrl,
  );
  const completion: Partial<Record<SettingsTab, boolean>> = {
    company: companyReady,
    history: history.length > 0,
    footer: footerReady,
    social: social.length > 0,
    business: businessReady,
    avatars: !avatarDirty,
    admins: true,
  };

  return (
    <ContentWorkbench
      rail={(closeRail) => (
        <SettingsRail
          tab={tab}
          onTabChange={(nextTab) => {
            setTab(nextTab);
            closeRail();
          }}
          dirty={dirty}
          companyReady={companyReady}
          historyCount={history.length}
          footerReady={footerReady}
          socialCount={social.length}
          businessReady={businessReady}
          businessComplete={businessComplete}
          avatarDirty={avatarDirty}
          isSuperAdmin={isSuperAdmin}
        />
      )}
      railLabel="설정 선택"
      identity={
        <>
          <span className="content-identity-art settings-identity-art">
            <Settings2 aria-hidden="true" />
          </span>
          <div className="content-identity-copy">
            <h2>사이트 공통 설정</h2>
          </div>
        </>
      }
      toolbar={
        <AdminLanguageTabs
          activeLang={historyLanguage}
          onChange={setHistoryLanguage}
          values={{
            ko: company.address_ko,
            en: company.address_en,
            ja: company.address_ja,
          }}
        />
      }
      actions={
        tab === "admins" ? null : (
          <>
            {tab !== "avatars" && <PreviewButton onClick={openPreview} />}
            <DraftSaveButton
              snapshot={snapshot}
              draft={draft}
              dirty={settingsDirty || nestedDrafts.dirty}
              saving={saving}
              extraDiff={nestedDrafts.diff}
              onSave={async () => {
                if (settingsDirty) await handleSave();
                await nestedDrafts.commit();
              }}
            />
          </>
        )
      }
      tabs={(isSuperAdmin
        ? settingsTabs
        : settingsTabs.filter((item) => item.id !== "admins")
      ).map((item) => ({
        ...item,
        complete: completion[item.id],
        missing: completion[item.id] ? 0 : 1,
      }))}
      activeTab={tab}
      onTabChange={setTab}
      error={error}
      onDismissError={() => setError("")}
      toast={toast}
      className="settings-workbench"
      recovery={
        recovery
          ? {
              updatedAt: recovery.updatedAt,
              onRestore: restoreBackup,
              onDiscard: discardBackup,
            }
          : null
      }
    >
      <SettingsEditorContent editor={editor} />
    </ContentWorkbench>
  );
}
