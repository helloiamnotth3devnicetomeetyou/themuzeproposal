"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  hasInvalidSocialLinks,
  type SocialLink,
} from "@/admin/components/content/SocialLinksField";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { useDraftBackup } from "@/admin/hooks/useDraftBackup";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import { adminDbError } from "@/admin/utils/admin-db-error";
import { uploadAdminAsset } from "@/admin/utils/upload-admin-asset";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import { supabase } from "@/core/supabase/client";
import {
  DEFAULT_HISTORY,
  sortHistoryNewestFirst,
  type HistoryEntry,
} from "@/core/content/site-content";
import {
  EMPTY_BUSINESS,
  EMPTY_COMPANY,
  EMPTY_DRAFT,
  EMPTY_FOOTER,
  EMPTY_SOCIAL,
  parseSettingsRows,
  type BusinessAssets,
  type CompanySettings,
  type FooterSettings,
  type HistoryLanguage,
  type SettingsDraft,
  type SettingsTab,
} from "./settings-editor-model";

export function useSettingsEditor(canManageAdminAccounts = false) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("company");
  const [company, setCompany] = useState<CompanySettings>(EMPTY_COMPANY);
  const [history, setHistory] = useState<HistoryEntry[]>(DEFAULT_HISTORY);
  const [historyLanguage, setHistoryLanguage] = useState<HistoryLanguage>("ko");
  const [footer, setFooter] = useState<FooterSettings>(EMPTY_FOOTER);
  const [social, setSocial] = useState<SocialLink[]>(EMPTY_SOCIAL);
  const [business, setBusiness] = useState<BusinessAssets>(EMPTY_BUSINESS);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [snapshot, setSnapshot] = useState(JSON.stringify(EMPTY_DRAFT));
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const isSuperAdmin = canManageAdminAccounts;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);
  const draft: SettingsDraft = useMemo(
    () => ({ company, history, footer, social, business }),
    [business, company, footer, history, social],
  );
  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft]);
  const settingsDirty = serializedDraft !== snapshot;
  const dirty = settingsDirty || avatarDirty;
  const restoreSettings = useCallback((saved: SettingsDraft) => {
    setCompany(saved.company);
    setHistory(saved.history);
    setFooter(saved.footer);
    setSocial(saved.social);
    setBusiness(saved.business);
  }, []);
  const { recovery, restoreBackup, discardBackup } = useDraftBackup({
    key: "admin-draft:settings",
    draft,
    snapshot,
    dirty: settingsDirty,
    restore: restoreSettings,
  });
  const nestedDrafts = usePageDrafts();
  const previewTarget =
    tab === "company"
      ? "/about?section=company#about-company"
      : tab === "history"
        ? "/about?section=history#about-history"
        : `/about?section=${tab}#site-footer`;
  const { openPreview } = useAdminPreview({
    kind: "site-settings",
    payload: draft,
    targetPath: previewTarget,
    canPreview: true,
    unavailableMessage: "미리보기를 열 수 없습니다.",
    onError: setError,
  });
  const historyEventKey: "event_ko" | "event_en" | "event_ja" =
    `event_${historyLanguage}`;

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("site_settings")
        .select("*");
      if (!active) return;
      if (fetchError) {
        setError(
          adminDbError(fetchError, "사이트 설정을 불러오지 못했습니다."),
        );
        setLoading(false);
        return;
      }
      const nextDraft = parseSettingsRows(
        data as Array<{ key: string; value: unknown }> | null,
      );
      setCompany(nextDraft.company);
      setHistory(nextDraft.history);
      setFooter(nextDraft.footer);
      setSocial(nextDraft.social);
      setBusiness(nextDraft.business);
      setSnapshot(JSON.stringify(nextDraft));
      setLoading(false);
    };
    void fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const allowedTabs = [
      "company",
      "history",
      "footer",
      "social",
      "business",
      "avatars",
      ...(isSuperAdmin ? ["admins"] : []),
    ];
    const handleUrlTab = () => {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && allowedTabs.includes(tabParam))
        setTab(tabParam as SettingsTab);
    };
    handleUrlTab();
    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail as string;
      if (detail && allowedTabs.includes(detail)) setTab(detail as SettingsTab);
    };
    window.addEventListener("admin-settings-tab-change", handleCustomEvent);
    return () =>
      window.removeEventListener(
        "admin-settings-tab-change",
        handleCustomEvent,
      );
  }, [isSuperAdmin]);

  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [dirty]);

  const patchHistory = (id: string, patch: Partial<HistoryEntry>) => {
    setHistory((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };
  const addHistory = () =>
    setHistory((items) => [
      {
        id: `history-${Date.now()}`,
        date: "",
        event_ko: "",
        event_en: "",
        event_ja: "",
      },
      ...items,
    ]);

  const uploadBusinessAsset = async (
    kind: "pressKitUrl" | "profilePdfUrl",
    file: File,
  ) => {
    const expected = kind === "pressKitUrl" ? "zip" : "pdf";
    if (file.name.split(".").pop()?.toLowerCase() !== expected) {
      setError(`${expected.toUpperCase()} 파일을 선택해 주세요.`);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("파일은 100MB까지 업로드할 수 있습니다.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const asset = await uploadAdminAsset(
        "business-assets",
        kind === "pressKitUrl" ? "press-kit.zip" : "profile.pdf",
        file,
      );
      setBusiness((current) => ({ ...current, [kind]: asset.url }));
      setToast("비즈니스 자료를 업로드했습니다. 변경사항을 저장해 공개하세요.");
    } catch (uploadError) {
      setError(
        adminDbError(
          uploadError && typeof uploadError === "object"
            ? (uploadError as { code?: string; message?: string })
            : null,
          "업로드하지 못했습니다.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setToast("");
    if (history.some((item) => !item.date.trim() || !item.event_ko.trim())) {
      setTab("history");
      setError("연혁의 시점과 한국어 내용을 모두 입력해 주세요.");
      return;
    }
    if (hasInvalidSocialLinks(social)) {
      setTab("social");
      setError("소셜 채널의 플랫폼, 이름 또는 웹 주소를 확인해 주세요.");
      return;
    }
    setSaving(true);
    const updates = [
      { key: "company", value: company },
      { key: "history", value: history },
      { key: "footer", value: footer },
      { key: "social", value: social },
      { key: "business_assets", value: business },
    ];
    const { error: saveError } = await supabase
      .from("site_settings")
      .upsert(updates as never[]);
    setSaving(false);
    if (saveError) {
      setError(adminDbError(saveError, "사이트 설정을 저장하지 못했습니다."));
      return;
    }
    setSnapshot(serializedDraft);
    discardBackup();
    await revalidatePublicCache("public-site-settings");
    showToast("사이트 설정을 저장했습니다.");
  };

  return {
    loading,
    saving,
    tab,
    setTab,
    company,
    setCompany,
    history,
    setHistory,
    historyLanguage,
    setHistoryLanguage,
    footer,
    setFooter,
    social,
    setSocial,
    business,
    setBusiness,
    avatarDirty,
    setAvatarDirty,
    snapshot,
    error,
    setError,
    toast,
    setToast,
    isSuperAdmin,
    showToast,
    draft,
    settingsDirty,
    dirty,
    recovery,
    restoreBackup,
    discardBackup,
    nestedDrafts,
    openPreview,
    historyEventKey,
    patchHistory,
    addHistory,
    uploadBusinessAsset,
    handleSave,
    sortHistoryNewestFirst,
  };
}
