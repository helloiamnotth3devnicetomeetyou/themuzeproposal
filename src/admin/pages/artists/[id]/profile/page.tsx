"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import OverflowDeleteMenu from "@/admin/components/content/OverflowDeleteMenu";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import { type UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import PreviewButton from "@/admin/components/content/PreviewButton";
import { hasInvalidSocialLinks } from "@/admin/components/content/SocialLinksField";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { usePageDrafts } from "@/admin/hooks/usePageDrafts";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import {
  deleteAdminAssetUrls,
  deleteAdminAssets,
} from "@/admin/utils/delete-admin-assets";
import {
  cleanupAbandonedDraftImageAssets,
  discardDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { supabase } from "@/core/supabase/client";
import { notifyArtistsChanged } from "@/core/utils/artist-events";
import { hasRichTextContent, sanitizeRichText } from "@/core/utils/rich-text";
import { adminDbError } from "@/admin/utils/admin-db-error";
import {
  EMPTY_PROFILE,
  profileTabs,
  toArtistSlug,
  type ProfileDraft,
  type ProfileTab,
} from "./profile-editor-model";
import ProfileEditorSections from "./ProfileEditorSections";
import ProfileContextRail from "./ProfileContextRail";
import { useArtistProfileLoader } from "./useArtistProfileLoader";
import { newArtistSteps, type NewArtistStep } from "./artist-profile-steps";
export default function ArtistProfileAdmin() {
  const routeId = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const heroCollapseRef = useRef(0);
  const isNew = routeId === "new";
  const [artistId, setArtistId] = useState<string | null>(() =>
    isNew ? crypto.randomUUID() : null,
  );
  const [tab, setTab] = useState<ProfileTab>("basic");
  const [newStep, setNewStep] = useState<NewArtistStep>("name");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [language, setLanguage] = useState<AdminLanguage>("ko");

  useEffect(() => {
    const handleUrlTab = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ProfileTab;
      if (
        tabParam &&
        [
          "basic",
          "visual",
          "content",
          "social",
          "scenes",
          "gallery",
          "publish",
        ].includes(tabParam)
      ) {
        setTab(tabParam);
      }
    };

    handleUrlTab();

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as ProfileTab;
      if (
        detail &&
        [
          "basic",
          "visual",
          "content",
          "social",
          "scenes",
          "gallery",
          "publish",
        ].includes(detail)
      ) {
        setTab(detail);
      }
    };

    window.addEventListener("admin-profile-tab-change", handleCustomEvent);
    return () => {
      window.removeEventListener("admin-profile-tab-change", handleCustomEvent);
    };
  }, []);

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
  } = useAdminEntityEditor<ProfileDraft>({
    initialDraft: isNew ? EMPTY_PROFILE : null,
    storageKey: `admin-draft:profile:${routeId}`,
  });
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const nestedDrafts = usePageDrafts();

  useEffect(() => {
    void cleanupAbandonedDraftImageAssets(supabase);
  }, []);

  const serializedDraft = useMemo(
    () => (draft ? JSON.stringify(draft) : ""),
    [draft],
  );
  void serializedDraft; // kept for forward-compat; dirty now derived from hook
  const saveIssues = useMemo(() => {
    const issues: string[] = [];
    if (!draft) return issues;
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
    unavailableMessage: "????? ??? ?? ?????? ?? ??? ???.",
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

  const handleProfileAssetChange = (
    field: "imageUrl" | "logoUrl",
    value: string,
  ) => {
    patchDraft({ [field]: value } as Pick<ProfileDraft, typeof field>);
  };

  const cancelNewArtist = async () => {
    const queued = uploadedAssets.current;
    uploadedAssets.current = [];
    await discardDraftImageAssets(supabase, queued);
    router.push("/admin");
  };

  const handleSave = async () => {
    if (!draft) return;
    if (saveIssues.length || !artistId) {
      setError(`필수 정보를 확인하세요: ${saveIssues.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    const originalDraft = snapshot
      ? (JSON.parse(snapshot) as ProfileDraft)
      : null;
    const payload = {
      slug: toArtistSlug(draft.engName),
      name: draft.name,
      eng_name: draft.engName,
      name_ko: draft.name,
      name_en: draft.engName,
      name_ja: draft.jaName || null,
      type: draft.type,
      debut_date: draft.debutDate || null,
      image_url: draft.imageUrl || null,
      logo_url: draft.logoUrl || null,
      color: draft.color.toUpperCase(),
      description_ko: sanitizeRichText(draft.descKo),
      description_en: sanitizeRichText(draft.descEn),
      description_ja: sanitizeRichText(draft.descJa),
      social_links: draft.socialLinks,
      is_active: draft.isActive,
    };
    const result = isNew
      ? await supabase
          .from("artists")
          .insert({ id: artistId, ...payload })
          .select("id")
          .single()
      : await supabase
          .from("artists")
          .update(payload)
          .eq("id", artistId)
          .select("id")
          .single();
    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "같은 영문명으로 생성된 공개 경로가 이미 사용 중입니다."
          : result.error.message.includes(
                "column of 'artists' in the schema cache",
              )
            ? "아티스트 프로필 DB 컬럼이 누락되었습니다. 최신 007_artist_profile_schema.sql을 적용한 뒤 다시 저장하세요."
            : result.error.message.includes("social_links")
              ? "공식 계정 컬럼이 없습니다. 005_artist_social_links.sql을 먼저 적용하세요."
              : result.error.message.includes("logo_url")
                ? "아티스트 로고 컬럼이 없습니다. 004_artist_assets.sql을 먼저 적용하세요."
                : adminDbError(
                    result.error,
                    "아티스트 정보를 저장하지 못했습니다.",
                  ),
      );
      setSaving(false);
      return;
    }
    setArtistId(result.data.id);
    setSnapshot(serializedDraft);
    discardDraftBackup();
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssets.current,
      [draft.imageUrl, draft.logoUrl],
      originalDraft ? [originalDraft.imageUrl, originalDraft.logoUrl] : [],
    );
    uploadedAssets.current = [];
    setSaving(false);
    await notifyArtistsChanged();
    setToast(isNew ? "아티스트를 만들었습니다." : "변경사항을 저장했습니다.");
    if (routeId !== result.data.id)
      router.replace(`/admin/artists/${result.data.id}/profile`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!artistId || isNew) return;
    setDeleting(true);
    setError("");
    const [
      galleryResult,
      memberResult,
      sceneResult,
      avatarResult,
      albumResult,
    ] = await Promise.all([
      supabase
        .from("artist_gallery")
        .select("image_url")
        .eq("artist_id", artistId),
      supabase
        .from("artist_members")
        .select("id,image_url")
        .eq("artist_id", artistId),
      supabase
        .from("artist_scenes")
        .select("id,image_url")
        .eq("artist_id", artistId),
      supabase
        .from("avatar_assets")
        .select("image_path")
        .eq("artist_id", artistId),
      supabase
        .from("albums")
        .select("id,cover_url,hero_image_url,typo_logo_url")
        .eq("artist_id", artistId),
    ]);
    const sceneIds = (sceneResult.data ?? [])
      .map((scene) => scene.id)
      .filter(Boolean);
    const memberIds = (memberResult.data ?? [])
      .map((member) => member.id)
      .filter(Boolean);
    const albumIds = (albumResult.data ?? [])
      .map((album) => album.id)
      .filter(Boolean);
    const [sceneRegionResult, memberRegionResult, trackResult] =
      await Promise.all([
        sceneIds.length
          ? supabase
              .from("artist_scene_members")
              .select("mask_url")
              .in("scene_id", sceneIds)
          : Promise.resolve({ data: [] }),
        memberIds.length
          ? supabase
              .from("artist_scene_members")
              .select("mask_url")
              .in("member_id", memberIds)
          : Promise.resolve({ data: [] }),
        albumIds.length
          ? supabase
              .from("tracks")
              .select("audio_url,music_video_url,logo_url")
              .in("album_id", albumIds)
          : Promise.resolve({ data: [] }),
      ]);
    const assetUrls = [
      draft?.imageUrl,
      draft?.logoUrl,
      ...(galleryResult.data ?? []).map((item) => item.image_url),
      ...(memberResult.data ?? []).map((member) => member.image_url),
      ...(sceneResult.data ?? []).map((scene) => scene.image_url),
      ...(sceneRegionResult.data ?? []).map((region) => region.mask_url),
      ...(memberRegionResult.data ?? []).map((region) => region.mask_url),
      ...(albumResult.data ?? []).flatMap((album) => [
        album.cover_url,
        album.hero_image_url,
        album.typo_logo_url,
      ]),
      ...(trackResult.data ?? []).flatMap((track) => [
        track.audio_url,
        track.music_video_url,
        track.logo_url,
      ]),
    ].filter((url): url is string => typeof url === "string" && Boolean(url));
    const avatarPaths = (avatarResult.data ?? [])
      .map((asset) => asset.image_path)
      .filter(
        (path): path is string => typeof path === "string" && Boolean(path),
      );
    const queued = uploadedAssets.current;
    const { error: deleteError } = await supabase
      .from("artists")
      .delete()
      .eq("id", artistId);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(adminDbError(deleteError, "아티스트를 삭제하지 못했습니다."));
      return;
    }
    await deleteAdminAssetUrls(assetUrls);
    if (avatarPaths.length)
      await deleteAdminAssets("artist-assets", avatarPaths);
    await discardDraftImageAssets(supabase, queued);
    uploadedAssets.current = [];
    await notifyArtistsChanged();
    router.replace("/admin");
    router.refresh();
  };

  useEffect(() => {
    const body = editorBodyRef.current;
    if (!body || loading) return;

    const setHeroCollapse = (
      shell: HTMLElement,
      collapse: number,
      maximum: number,
    ) => {
      heroCollapseRef.current = collapse;
      shell.style.setProperty("--profile-hero-collapse", `${collapse}px`);
      shell.classList.toggle("is-hero-compact", collapse > maximum * 0.55);
    };

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.deltaY) return;
      const shell = body.closest(".profile-workbench") as HTMLElement | null;
      if (!shell) return;

      const maximum =
        window.innerWidth <= 560 ? 92 : window.innerWidth <= 850 ? 109 : 128;
      const current = Math.min(heroCollapseRef.current, maximum);

      if (event.deltaY > 0) {
        const remainingOverflow = Math.max(
          0,
          body.scrollHeight - body.clientHeight,
        );
        const usefulMaximum = Math.min(maximum, current + remainingOverflow);
        if (current >= usefulMaximum) return;

        event.preventDefault();
        const next = Math.min(usefulMaximum, current + event.deltaY);
        const unconsumedDelta = Math.max(0, event.deltaY - (next - current));
        setHeroCollapse(shell, next, maximum);
        if (unconsumedDelta) body.scrollTop += unconsumedDelta;
        return;
      }

      if (body.scrollTop <= 0 && current > 0) {
        event.preventDefault();
        setHeroCollapse(shell, Math.max(0, current + event.deltaY), maximum);
      }
    };

    body.addEventListener("wheel", handleWheel, { passive: false });
    return () => body.removeEventListener("wheel", handleWheel);
  }, [loading]);

  if (loading || !draft)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (
    <ProfileContextRail
      completion={completion}
      draft={draft}
      isNew={isNew}
      onCancel={() => void cancelNewArtist()}
    />
  );

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

  if (isNew) {
    const stepIndex = newArtistSteps.findIndex((item) => item.id === newStep);
    const currentReady =
      newStep === "name"
        ? creationReady.name
        : newStep === "visual"
          ? creationReady.visual
          : newStep === "content"
            ? creationReady.content
            : true;
    const creationComplete =
      creationReady.name &&
      creationReady.visual &&
      creationReady.content &&
      !saveIssues.length;
    const wizardTab =
      newStep === "name"
        ? "basic"
        : newStep === "visual"
          ? "visual"
          : "content";
    const wizardActions = (
      <>
        {stepIndex > 0 && (
          <button
            type="button"
            data-tour-id="profile-wizard-back"
            className="admin-btn admin-btn-secondary"
            onClick={() => setNewStep(newArtistSteps[stepIndex - 1].id)}
          >
            <ArrowLeft aria-hidden="true" />
            이전
          </button>
        )}
        {stepIndex < newArtistSteps.length - 1 ? (
          <button
            type="button"
            data-tour-id="profile-wizard-next"
            className="admin-btn admin-btn-primary"
            disabled={!currentReady}
            onClick={() => setNewStep(newArtistSteps[stepIndex + 1].id)}
          >
            다음
            <ArrowRight aria-hidden="true" />
          </button>
        ) : (
          <DraftSaveButton
            snapshot={snapshot}
            draft={draft}
            dirty={dirty}
            saving={saving}
            onSave={handleSave}
            disabled={!creationComplete}
            label="아티스트 만들기"
          />
        )}
      </>
    );

    return (
      <ContentWorkbench
        rail={
          <ProfileContextRail
            completion={completion.slice(0, 3)}
            draft={draft}
            isNew
            onCancel={() => void cancelNewArtist()}
          />
        }
        identity={identity}
        actions={wizardActions}
        toolbar={
          <AdminLanguageTabs
            activeLang={language}
            onChange={setLanguage}
            values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
          />
        }
        tabs={newArtistSteps.map((item) => ({
          ...item,
          complete:
            item.id === "name"
              ? creationReady.name
              : item.id === "visual"
                ? creationReady.visual
                : item.id === "content"
                  ? creationReady.content
                  : creationComplete,
          missing:
            item.id === "name"
              ? creationReady.name
                ? 0
                : 1
              : item.id === "visual"
                ? creationReady.visual
                  ? 0
                  : 1
                : item.id === "content"
                  ? creationReady.content
                    ? 0
                    : 1
                  : creationComplete
                    ? 0
                    : 1,
        }))}
        activeTab={newStep}
        onTabChange={(next) => {
          if (newArtistSteps.findIndex((item) => item.id === next) <= stepIndex)
            setNewStep(next);
        }}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        recovery={
          recovery
            ? {
                updatedAt: recovery.updatedAt,
                onRestore: restoreDraft,
                onDiscard: discardDraftBackup,
              }
            : null
        }
        className="profile-workbench artist-create-wizard"
      >
        {newStep === "done" ? (
          <div className="content-editor-stack artist-create-review">
            <div className="content-section-heading">
              <h3>생성 준비가 끝났습니다</h3>
              <span>
                아티스트를 만든 뒤 멤버, 음악, 일정과 나머지 프로필 탭을 이어서
                편집할 수 있습니다.
              </span>
            </div>
            <div className="content-publish-summary">
              <div>
                <span>아티스트</span>
                <strong>
                  {draft.name} / {draft.engName}
                </strong>
              </div>
              <div>
                <span>공개 경로</span>
                <strong>/{previewSlug}</strong>
              </div>
              <div>
                <span>대표 비주얼</span>
                <strong>{draft.imageUrl ? "설정 완료" : "확인 필요"}</strong>
              </div>
              <div>
                <span>소개</span>
                <strong>{draft.descKo ? "설정 완료" : "확인 필요"}</strong>
              </div>
            </div>
            <p className="artist-create-ready">
              <CheckCircle2 aria-hidden="true" />
              상단의 ‘아티스트 만들기’를 누르면 전체 탭 에디터로 이동합니다.
            </p>
          </div>
        ) : (
          <ProfileEditorSections
            artistId={artistId}
            isNew
            draft={draft}
            saveIssues={saveIssues}
            tab={wizardTab}
            patchDraft={patchDraft}
            language={language}
            onAssetChange={handleProfileAssetChange}
            onUploaded={(asset) => {
              uploadedAssets.current.push(asset);
              trackDraftImageAsset(asset);
            }}
            onError={setError}
            onToast={setToast}
          />
        )}
      </ContentWorkbench>
    );
  }

  return (
    <>
      <ContentWorkbench
        rail={rail}
        identity={identity}
        actions={
          <>
            <PreviewButton onClick={openPreview} disabled={!previewPayload} />
            {!isNew && (
              <OverflowDeleteMenu
                onDelete={() =>
                  pendingDelete ? setPendingDelete(false) : setDeleteOpen(true)
                }
                deleteLabel={pendingDelete ? "삭제 취소" : "삭제"}
              />
            )}
            <DraftSaveButton
              snapshot={snapshot}
              draft={draft}
              dirty={dirty || nestedDrafts.dirty || pendingDelete}
              saving={saving}
              extraDiff={[
                ...(pendingDelete
                  ? [
                      {
                        kind: "delete" as const,
                        field: "아티스트",
                        before: draft.name,
                        after: "삭제",
                      },
                    ]
                  : []),
                ...nestedDrafts.diff,
              ]}
              onSave={async () => {
                if (pendingDelete) return handleDelete();
                if (dirty) await handleSave();
                await nestedDrafts.commit();
              }}
              disabled={!pendingDelete && Boolean(saveIssues.length)}
              label={isNew ? "아티스트 만들기" : "변경사항 저장"}
            />
          </>
        }
        toolbar={
          <AdminLanguageTabs
            activeLang={language}
            onChange={setLanguage}
            values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
          />
        }
        tabs={profileTabs.map((item, index) => ({
          ...item,
          complete: completion[index]?.ready,
          missing: completion[index]?.ready ? 0 : 1,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        bodyRef={editorBodyRef}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        recovery={
          recovery
            ? {
                updatedAt: recovery.updatedAt,
                onRestore: restoreDraft,
                onDiscard: discardDraftBackup,
              }
            : null
        }
        className="profile-workbench"
      >
        <ProfileEditorSections
          artistId={artistId}
          isNew={isNew}
          draft={draft}
          saveIssues={saveIssues}
          tab={tab}
          language={language}
          patchDraft={patchDraft}
          onAssetChange={handleProfileAssetChange}
          onUploaded={(asset) => {
            uploadedAssets.current.push(asset);
            trackDraftImageAsset(asset);
          }}
          onError={setError}
          onToast={setToast}
        />
      </ContentWorkbench>
      {deleteOpen && (
        <DeleteConfirmDialog
          title="아티스트를 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.name}
          valueLabel="아티스트명"
          busy={deleting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            setPendingDelete(true);
            setDeleteOpen(false);
          }}
        />
      )}
    </>
  );
}
