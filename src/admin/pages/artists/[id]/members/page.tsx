"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { UserRound } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
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
import { deleteAdminAssetUrls } from "@/admin/utils/delete-admin-assets";
import {
  cleanupAbandonedDraftImageAssets,
  discardDraftImageAssets,
  finalizeDraftImageAssets,
  trackDraftImageAsset,
} from "@/admin/utils/draft-assets";
import { supabase } from "@/core/supabase/client";
import { revalidatePublicCache } from "@/core/utils/public-cache";
import { adminDbError } from "@/admin/utils/admin-db-error";
import {
  EMPTY_MEMBER,
  memberTabs,
  memberToDraft,
  toMemberSlug,
  type Member,
  type MemberDraft,
  type MemberTab,
} from "./member-editor-model";
import MemberEditorSections from "./MemberEditorSections";
import MemberLibraryRail from "./MemberLibraryRail";

export default function ArtistMembersAdmin() {
  const routeArtistId = useParams<{ id: string }>()?.id;
  const selectedMemberId = useSearchParams().get("member");
  const requestConfirm = useAdminConfirm();
  const [artistId, setArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<MemberTab>("basic");
  const [sorting, setSorting] = useState(false);
  const [sortDirty, setSortDirty] = useState(false);
  const [dragMember, setDragMember] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [language, setLanguage] = useState<AdminLanguage>("ko");

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
  } = useAdminEntityEditor<MemberDraft>({
    initialDraft: null,
    storageKey: `admin-draft:members:${routeArtistId}`,
  });
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);
  const nestedDrafts = usePageDrafts();

  useEffect(() => {
    void cleanupAbandonedDraftImageAssets(supabase);
  }, []);

  const canSave = Boolean(
    draft?.name.trim() &&
    draft.engName.trim() &&
    toMemberSlug(draft.engName) &&
    /^#[0-9a-f]{6}$/i.test(draft.color) &&
    !hasInvalidSocialLinks(draft.socialLinks),
  );
  const previewMemberSlug = draft ? toMemberSlug(draft.engName) : "";
  const previewMemberId = draft?.id || newMemberId || "";
  const previewPayload = useMemo(
    () =>
      draft && artistId && artistSlug && previewMemberSlug && previewMemberId
        ? {
            artist: { id: artistId, slug: artistSlug, name: artistName },
            member: {
              id: previewMemberId,
              slug: previewMemberSlug,
              name: draft.name,
              eng_name: draft.engName || null,
              name_ko: draft.name,
              name_en: draft.engName || null,
              name_ja: draft.jaName || null,
              role_ko: draft.roleKo || null,
              role_en: draft.roleEn || null,
              role_ja: draft.roleJa || null,
              birth: draft.birth || null,
              mbti: draft.mbti || null,
              image_url: draft.imageUrl || null,
              color: draft.color || null,
              bio_ko: draft.bioKo || null,
              bio_en: draft.bioEn || null,
              bio_ja: draft.bioJa || null,
              sort_order: Math.max(
                1,
                members.findIndex((member) => member.id === draft.id) + 1 ||
                  members.length + 1,
              ),
            },
          }
        : null,
    [
      artistId,
      artistName,
      artistSlug,
      draft,
      members,
      previewMemberId,
      previewMemberSlug,
    ],
  );
  const { openPreview } = useAdminPreview({
    kind: "artist-member",
    payload: previewPayload,
    targetPath:
      artistSlug && previewMemberSlug
        ? `/${artistSlug}/artist/${previewMemberSlug}`
        : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "미리보기를 열 수 없습니다.",
    onError: setError,
  });

  const discardQueuedUploads = useCallback(async () => {
    const queued = uploadedAssets.current;
    uploadedAssets.current = [];
    await discardDraftImageAssets(supabase, queued);
  }, []);

  const loadMembers = useCallback(
    async (preferredId?: string) => {
      setLoading(true);
      setError("");
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id,name,slug")
        .eq("id", routeArtistId)
        .single();
      if (artistError || !artist) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      const { data, error: memberError } = await supabase
        .from("artist_members")
        .select("*")
        .eq("artist_id", artist.id)
        .order("sort_order", { ascending: true });
      if (memberError) {
        setError(adminDbError(memberError, "멤버 목록을 불러오지 못했습니다."));
        setLoading(false);
        return;
      }
      const nextMembers = (data as Member[] | null) ?? [];
      const selected =
        nextMembers.find(
          (member) => member.id === (preferredId || selectedMemberId),
        ) ??
        nextMembers[0] ??
        null;
      setArtistId(artist.id);
      setArtistName(artist.name || "아티스트");
      setArtistSlug(artist.slug || "");
      setMembers(nextMembers);
      setNewMemberId(null);
      setPendingDelete(false);
      if (selected) {
        const nextDraft = memberToDraft(selected);
        setDraft(nextDraft);
        setSnapshot(JSON.stringify(nextDraft));
      } else {
        setDraft(null);
        setSnapshot("");
      }
      setLoading(false);
    },
    [
      routeArtistId,
      selectedMemberId,
      setDraft,
      setError,
      setLoading,
      setSnapshot,
    ],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadMembers());
  }, [loadMembers]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || sortDirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, sortDirty]);

  const selectMember = async (member: Member) => {
    if (sorting) return;
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "변경사항을 버릴까요?",
        description:
          "현재 멤버에서 저장하지 않은 내용이 사라집니다. 다른 멤버를 열기 전에 한 번 더 확인해 주세요.",
        confirmLabel: "버리고 열기",
        tone: "danger",
      }))
    )
      return;
    const nextDraft = memberToDraft(member);
    await discardQueuedUploads();
    setNewMemberId(null);
    setPendingDelete(false);
    setDraft(nextDraft);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("basic");
    setError("");
  };

  const addMember = async () => {
    if (
      (dirty || pendingDelete) &&
      !(await requestConfirm({
        title: "새 멤버를 만들까요?",
        description:
          "현재 멤버에서 저장하지 않은 내용이 사라지고 새 멤버 작성 화면으로 이동합니다.",
        confirmLabel: "버리고 새로 만들기",
        tone: "danger",
      }))
    )
      return;
    setNewMemberId(crypto.randomUUID());
    await discardQueuedUploads();
    setDraft({ ...EMPTY_MEMBER });
    setPendingDelete(false);
    setSnapshot(JSON.stringify(EMPTY_MEMBER));
    setTab("basic");
    setError("");
    setSorting(false);
    setSortDirty(false);
  };

  const handleMemberImageChange = (imageUrl: string) => {
    patchDraft({ imageUrl });
  };

  const saveMember = async () => {
    if (!draft || !artistId || !canSave) {
      setError("이름, 영문 이름, 한국어 역할을 확인하세요.");
      return;
    }
    setSaving(true);
    setError("");
    const originalDraft = snapshot
      ? (JSON.parse(snapshot) as MemberDraft)
      : null;
    const payload = {
      artist_id: artistId,
      name: draft.name,
      eng_name: draft.engName,
      name_ko: draft.name,
      name_en: draft.engName,
      name_ja: draft.jaName || null,
      slug: toMemberSlug(draft.engName),
      role_ko: draft.roleKo,
      role_en: draft.roleEn,
      role_ja: draft.roleJa,
      birth: draft.birth || null,
      mbti: draft.mbti || null,
      image_url: draft.imageUrl || null,
      color: draft.color.toUpperCase(),
      bio_ko: draft.bioKo,
      bio_en: draft.bioEn,
      bio_ja: draft.bioJa,
      social_links: draft.socialLinks,
    };
    const pendingId = newMemberId || crypto.randomUUID();
    const result = draft.id
      ? await supabase
          .from("artist_members")
          .update(payload)
          .eq("id", draft.id)
          .select("id")
          .single()
      : await supabase
          .from("artist_members")
          .insert({
            id: pendingId,
            ...payload,
            sort_order: Math.max(
              0,
              ...members.map((member) => member.sort_order),
            ) + 1,
          })
          .select("id")
          .single();
    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "같은 영문명으로 생성된 공개 경로가 이미 사용 중입니다."
          : result.error.message.includes(
                "column of 'artist_members' in the schema cache",
              )
            ? "멤버 프로필 DB 컬럼이 누락되었습니다. 최신 007_artist_profile_schema.sql을 적용한 뒤 다시 저장하세요."
            : result.error.message.includes("social_links")
              ? "공식 계정 컬럼이 없습니다. 005_artist_social_links.sql을 먼저 적용하세요."
              : adminDbError(result.error, "멤버 정보를 저장하지 못했습니다."),
      );
      setSaving(false);
      return;
    }
    setToast(
      draft.id ? "멤버 정보를 저장했습니다." : "새 멤버를 추가했습니다.",
    );
    discardDraftBackup();
    await loadMembers(result.data.id);
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssets.current,
      [draft.imageUrl],
      originalDraft ? [originalDraft.imageUrl] : [],
    );
    uploadedAssets.current = [];
    await revalidatePublicCache(
      "artist-scene-data",
      "public-member-title",
      "public-discography",
    );
    setSaving(false);
  };

  const removeMember = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const memberId = draft.id;
    const { data: regions } = await supabase
      .from("artist_scene_members")
      .select("mask_url")
      .eq("member_id", memberId);
    const queued = uploadedAssets.current;
    const assetUrls = [
      draft.imageUrl,
      ...(regions ?? []).map((region) => region.mask_url || ""),
    ];
    const { error: deleteError } = await supabase
      .from("artist_members")
      .delete()
      .eq("id", draft.id);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(adminDbError(deleteError, "멤버를 삭제하지 못했습니다."));
      return;
    }
    await deleteAdminAssetUrls(assetUrls);
    await discardDraftImageAssets(supabase, queued);
    uploadedAssets.current = [];
    setDeleteOpen(false);
    setToast("멤버를 삭제했습니다.");
    await revalidatePublicCache(
      "artist-scene-data",
      "public-member-title",
      "public-discography",
    );
    await loadMembers();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _reorderMember = (targetId: string) => {
    if (!dragMember || dragMember === targetId) return;
    setMembers((current) => {
      const next = [...current];
      const from = next.findIndex((member) => member.id === dragMember);
      const to = next.findIndex((member) => member.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragMember(null);
    setSortDirty(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    const { error: reorderError } = await supabase.rpc(
      "reorder_artist_members",
      {
        p_artist_id: artistId,
        p_member_ids: members.map((member) => member.id),
      },
    );
    setSaving(false);
    if (reorderError) {
      setError(reorderError.message);
      return;
    }
    setSorting(false);
    setSortDirty(false);
    setToast("멤버 노출 순서를 저장했습니다.");
    await revalidatePublicCache("artist-scene-data", "public-discography");
    await loadMembers(draft?.id || undefined);
  };

  if (loading)
    return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const rail = (
    <MemberLibraryRail
      draft={draft}
      members={members}
      sorting={sorting}
      sortDirty={sortDirty}
      onAdd={() => void addMember()}
      onSelect={(member) => void selectMember(member)}
      onReorder={(activeId, overId) => {
        setMembers((current) => {
          const from = current.findIndex((m) => m.id === activeId);
          const to = current.findIndex((m) => m.id === overId);
          if (from < 0 || to < 0) return current;
          return arrayMove(current, from, to);
        });
        setSortDirty(true);
      }}
      onToggleSorting={() => {
        setSorting((value) => !value);
        setSortDirty(false);
      }}
    />
  );

  const identity = draft ? (
    <>
      <span className="content-identity-art">
        {draft.imageUrl ? (
          <AdminAssetImage src={draft.imageUrl} alt="" sizes="56px" />
        ) : (
          <i style={{ background: draft.color }} />
        )}
      </span>
      <div className="content-identity-copy">
        <p>
          <span className={`cms-status ${draft.id ? "is-live" : ""}`}>
            {draft.id ? "등록됨" : "신규"}
          </span>
        </p>
        <h2>{draft.name || "이름 없는 멤버"}</h2>
        <small>{artistName}</small>
      </div>
    </>
  ) : (
    <div className="content-identity-copy">
      <p>
        <span className="cms-status">선택 안 됨</span>
      </p>
      <h2>멤버를 선택하세요</h2>
      <small>{artistName}</small>
    </div>
  );

  const actions = draft ? (
    <>
      <PreviewButton onClick={openPreview} disabled={!previewPayload} />
      {draft.id && (
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
        dirty={dirty || sortDirty || nestedDrafts.dirty || pendingDelete}
        saving={saving}
        disabled={!pendingDelete && !canSave && dirty}
        extraDiff={[
          ...(pendingDelete
            ? [
                {
                  kind: "delete" as const,
                  field: "멤버",
                  before: draft.name,
                  after: "삭제",
                },
              ]
            : []),
          ...(sortDirty
            ? [
                {
                  kind: "order" as const,
                  field: "멤버 노출 순서",
                  before: "기존 순서",
                  after: "변경된 순서",
                },
              ]
            : []),
          ...nestedDrafts.diff,
        ]}
        onSave={async () => {
          if (pendingDelete) return removeMember();
          if (dirty) await saveMember();
          if (sortDirty) await saveOrder();
          await nestedDrafts.commit();
        }}
      />
    </>
  ) : (
    <button
      type="button"
      className="admin-btn admin-btn-primary"
      onClick={() => void addMember()}
    >
      첫 멤버 추가
    </button>
  );

  return (
    <>
      <ContentWorkbench
        rail={rail}
        railLabel="멤버 선택"
        identity={identity}
        actions={actions}
        toolbar={
          draft ? (
            <AdminLanguageTabs
              activeLang={language}
              onChange={setLanguage}
              values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
            />
          ) : null
        }
        tabs={memberTabs.map((item) => ({
          ...item,
          complete:
            item.id === "basic"
              ? Boolean(draft?.name && draft.engName)
              : item.id === "profile"
                ? Boolean(
                    draft?.imageUrl && /^#[0-9a-f]{6}$/i.test(draft.color),
                  )
                : item.id === "content"
                  ? Boolean(draft?.bioKo)
                  : item.id === "social"
                    ? Boolean(
                        draft && !hasInvalidSocialLinks(draft.socialLinks),
                      )
                    : Boolean(draft?.id),
          missing:
            item.id === "basic"
              ? [draft?.name, draft?.engName].filter((value) => !value).length
              : item.id === "profile"
                ? [
                    draft?.imageUrl,
                    /^#[0-9a-f]{6}$/i.test(draft?.color || ""),
                  ].filter((value) => !value).length
                : item.id === "content"
                  ? draft?.bioKo
                    ? 0
                    : 1
                  : item.id === "social"
                    ? draft && !hasInvalidSocialLinks(draft.socialLinks)
                      ? 0
                      : 1
                    : 0,
        }))}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        onDismissError={() => setError("")}
        toast={toast}
        className="member-workbench"
        recovery={
          recovery
            ? {
                updatedAt: recovery.updatedAt,
                onRestore: restoreDraft,
                onDiscard: discardDraftBackup,
              }
            : null
        }
      >
        {!draft ? (
          <div className="content-no-selection">
            <span>
              <UserRound aria-hidden="true" />
            </span>
            <h2>멤버를 선택하세요</h2>
            <p>
              왼쪽 라이브러리에서 멤버를 선택하거나 새 멤버를 추가할 수
              있습니다.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => void addMember()}
            >
              첫 멤버 추가
            </button>
          </div>
        ) : (
          <MemberEditorSections
            artistId={artistId}
            draft={draft}
            newMemberId={newMemberId}
            tab={tab}
            patchDraft={patchDraft}
            onImageChange={handleMemberImageChange}
            onUploaded={(asset) => {
              uploadedAssets.current.push(asset);
              trackDraftImageAsset(asset);
            }}
            onError={setError}
            onToast={setToast}
            language={language}
          />
        )}
      </ContentWorkbench>
      {deleteOpen && draft?.id && (
        <DeleteConfirmDialog
          title="멤버를 삭제할까요?"
          description="삭제 작업은 상단 저장 전까지 서버에 반영되지 않습니다."
          confirmValue={draft.name}
          valueLabel="멤버명"
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
