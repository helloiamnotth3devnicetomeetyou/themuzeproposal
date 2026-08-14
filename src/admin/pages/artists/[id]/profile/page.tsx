"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import { hasInvalidSocialLinks } from "@/admin/components/content/SocialLinksField";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import {
  cleanupAbandonedDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { supabase } from "@/core/supabase/client";
import { hasRichTextContent } from "@/core/utils/rich-text";
import {
  EMPTY_PROFILE,
  profileTabs,
  toArtistSlug,
  type ProfileDraft,
  type ProfileTab,
} from "./profile-editor-model";
import type { NewArtistStep } from "./artist-profile-steps";
import ProfileContextRail from "./ProfileContextRail";
import ProfileWizard from "./ProfileWizard";
import ProfileWorkbench from "./ProfileWorkbench";
import { useArtistProfileActions } from "./useArtistProfileActions";
import { useArtistProfileLoader } from "./useArtistProfileLoader";
import { useProfileHeroCollapse } from "./useProfileHeroCollapse";

export default function ArtistProfileAdmin() {
  const routeId = useParams<{ id: string }>()?.id;
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const isNew = routeId === "new";
  const [artistId, setArtistId] = useState<string | null>(() =>
    isNew ? crypto.randomUUID() : null,
  );
  const [tab, setTab] = useState<ProfileTab>("basic");
  const [newStep, setNewStep] = useState<NewArtistStep>("name");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [language, setLanguage] = useState<AdminLanguage>("ko");
  const nestedDrafts = usePageDrafts();
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const editor = useAdminEntityEditor<ProfileDraft>({
    initialDraft: isNew ? EMPTY_PROFILE : null,
    storageKey: `admin-draft:profile:${routeId}`,
  });
  const {
    draft,
    setDraft,
    snapshot,
    setSnapshot,
    dirty,
    loading,
    setLoading,
    saving,
    setSaving,
    deleting,
    setDeleting,
    deleteOpen,
    setDeleteOpen,
    error,
    setError,
    toast,
    setToast,
    patchDraft,
    recovery,
    restoreDraft,
    discardDraftBackup,
  } = editor;

  useEffect(() => {
    const validTabs = profileTabs.map((item) => item.id);
    const readTab = () => {
      const value = new URLSearchParams(window.location.search).get("tab");
      if (validTabs.includes(value as ProfileTab)) setTab(value as ProfileTab);
    };
    const changeTab = (event: Event) => {
      const value = (event as CustomEvent<ProfileTab>).detail;
      if (validTabs.includes(value)) setTab(value);
    };
    readTab();
    window.addEventListener("admin-profile-tab-change", changeTab);
    return () =>
      window.removeEventListener("admin-profile-tab-change", changeTab);
  }, []);

  useEffect(() => {
    void cleanupAbandonedDraftImageAssets(supabase);
  }, []);

  const saveIssues = useMemo(() => {
    if (!draft) return [];
    const issues: string[] = [];
    if (!draft.name.trim()) issues.push("한국어 아티스트명");
    if (!draft.engName.trim()) issues.push("영문 아티스트명");
    if (!toArtistSlug(draft.engName)) issues.push("영문명 기반 공개 경로");
    if (!/^#[0-9a-f]{6}$/i.test(draft.color)) issues.push("테마 컬러");
    if (hasInvalidSocialLinks(draft.socialLinks)) issues.push("공식 계정 링크");
    return issues;
  }, [draft]);
  const completion = draft
    ? [
        {
          label: "이름과 기본 정보",
          ready: Boolean(
            draft.name && draft.engName && toArtistSlug(draft.engName),
          ),
        },
        {
          label: "대표 이미지와 컬러",
          ready: Boolean(draft.imageUrl && /^#[0-9a-f]{6}$/i.test(draft.color)),
        },
        {
          label: "한국어 아티스트 소개",
          ready: hasRichTextContent(draft.descKo),
        },
        {
          label: "공식 계정",
          ready: !hasInvalidSocialLinks(draft.socialLinks),
        },
        { label: "인터랙티브 장면", ready: !isNew },
        { label: "갤러리", ready: !isNew },
        {
          label: "공개 상태 확인",
          ready: !draft.isActive || saveIssues.length === 0,
        },
      ]
    : [];
  const previewSlug = draft ? toArtistSlug(draft.engName) : "";
  const creationReady = draft
    ? {
        name: Boolean(draft.name.trim() && draft.engName.trim() && previewSlug),
        visual: Boolean(draft.imageUrl && /^#[0-9a-f]{6}$/i.test(draft.color)),
        content: hasRichTextContent(draft.descKo),
      }
    : { name: false, visual: false, content: false };
  const previewPayload = useMemo(
    () =>
      draft && artistId && previewSlug
        ? {
            artist: {
              id: artistId,
              slug: previewSlug,
              name: draft.name,
              eng_name: draft.engName,
              name_ko: draft.name,
              name_en: draft.engName,
              name_ja: draft.jaName || null,
              type: draft.type,
              debut_date: draft.debutDate || null,
              image_url: draft.imageUrl || null,
              logo_url: draft.logoUrl || null,
              color: draft.color || null,
              description_ko: draft.descKo || null,
              description_en: draft.descEn || null,
              description_ja: draft.descJa || null,
              social_links: draft.socialLinks,
              is_active: draft.isActive,
            },
          }
        : null,
    [artistId, draft, previewSlug],
  );
  const { openPreview } = useAdminPreview({
    kind: "artist-profile",
    payload: previewPayload,
    targetPath: previewSlug ? `/${previewSlug}/artist` : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "미리보기를 열 수 없습니다.",
    onError: setError,
  });

  useArtistProfileLoader(
    routeId,
    isNew,
    setArtistId,
    setDraft,
    setSnapshot,
    setLoading,
    setError,
  );
  const { cancelNewArtist, handleSave, handleDelete } = useArtistProfileActions(
    {
      artistId,
      draft,
      snapshot,
      isNew,
      routeId,
      saveIssues,
      uploadedAssetsRef: uploadedAssets,
      setArtistId,
      setDraft,
      setSnapshot,
      setSaving,
      setDeleting,
      setDeleteOpen,
      setError,
      setToast,
      discardDraftBackup,
    },
  );
  useProfileHeroCollapse(editorBodyRef, loading);

  const handleProfileAssetChange = (
    field: "imageUrl" | "logoUrl",
    value: string,
  ) => patchDraft({ [field]: value } as Pick<ProfileDraft, typeof field>);
  const handleUploaded = (asset: UploadedImageAsset) => {
    uploadedAssets.current.push(asset);
    trackDraftImageAsset(asset);
  };
  const recoveryNotice = recovery
    ? {
        updatedAt: recovery.updatedAt,
        onRestore: restoreDraft,
        onDiscard: discardDraftBackup,
      }
    : null;

  if (loading || !draft)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const identity = (
    <>
      <span className="content-identity-art">
        {draft.imageUrl ? (
          <AdminAssetImage src={draft.imageUrl} alt="" sizes="56px" />
        ) : (
          <i style={{ background: draft.color }} />
        )}
      </span>
      <div className="content-identity-copy">
        <h2>
          <span className={`cms-status ${draft.isActive ? "is-live" : ""}`}>
            {draft.isActive ? "공개" : "비공개"}
          </span>
          <span>{draft.name || "이름 없는 아티스트"}</span>
        </h2>
      </div>
    </>
  );

  if (isNew)
    return (
      <ProfileWizard
        identity={identity}
        draft={draft}
        artistId={artistId}
        completion={completion}
        creationReady={creationReady}
        saveIssues={saveIssues}
        previewSlug={previewSlug}
        newStep={newStep}
        setNewStep={setNewStep}
        snapshot={snapshot}
        dirty={dirty}
        saving={saving}
        error={error}
        toast={toast}
        recovery={recoveryNotice}
        language={language}
        setLanguage={setLanguage}
        setError={setError}
        patchDraft={patchDraft}
        onAssetChange={handleProfileAssetChange}
        onUploaded={handleUploaded}
        onToast={setToast}
        onCancel={() => void cancelNewArtist()}
        onSave={handleSave}
      />
    );

  const rail = (
    <ProfileContextRail
      completion={completion}
      draft={draft}
      isNew={false}
      onCancel={() => void cancelNewArtist()}
    />
  );
  const saveAll = async () => {
    if (pendingDelete) return handleDelete();
    await nestedDrafts.commit();
    if (dirty) await handleSave();
  };

  return (
    <ProfileWorkbench
      identity={identity}
      rail={rail}
      draft={draft}
      artistId={artistId}
      completion={completion}
      saveIssues={saveIssues}
      tab={tab}
      setTab={setTab}
      language={language}
      setLanguage={setLanguage}
      patchDraft={patchDraft}
      onAssetChange={handleProfileAssetChange}
      onUploaded={handleUploaded}
      onError={setError}
      onToast={setToast}
      previewEnabled={Boolean(previewPayload)}
      onPreview={openPreview}
      pendingDelete={pendingDelete}
      setPendingDelete={setPendingDelete}
      snapshot={snapshot}
      dirty={dirty}
      saving={saving}
      nestedDrafts={nestedDrafts}
      onSave={saveAll}
      error={error}
      setError={setError}
      toast={toast}
      recovery={recoveryNotice}
      editorBodyRef={editorBodyRef}
      deleteOpen={deleteOpen}
      setDeleteOpen={setDeleteOpen}
      deleting={deleting}
      artistName={draft.name}
    />
  );
}
