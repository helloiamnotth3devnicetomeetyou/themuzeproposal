"use client";

import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LuPlus, LuUserRound } from "react-icons/lu";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import ContentWorkbench, { type WorkbenchTab } from "@/admin/components/content/ContentWorkbench";
import DeleteConfirmDialog from "@/admin/components/shell/DeleteConfirmDialog";
import FormField from "@/admin/components/content/FormField";
import GalleryManager from "@/admin/components/assets/GalleryManager";
import ImageAssetField, { type UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import PreviewButton from "@/admin/components/content/PreviewButton";
import SocialLinksField, { hasInvalidSocialLinks, normalizeSocialLinks, type SocialLink } from "@/admin/components/content/SocialLinksField";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { useAdminCrud } from "@/admin/hooks/useAdminCrud";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { cleanupAbandonedDraftImageAssets, discardDraftImageAssets, finalizeDraftImageAssets, trackDraftImageAsset } from "@/admin/utils/draft-assets";
import { supabase } from "@/core/supabase/client";

type Member = {
  id: string;
  name: string;
  eng_name: string | null;
  slug: string;
  role_ko: string | null;
  role_en: string | null;
  role_ja: string | null;
  birth: string | null;
  mbti: string | null;
  image_url: string | null;
  color: string | null;
  bio_ko: string | null;
  bio_en: string | null;
  bio_ja: string | null;
  social_links: unknown;
  sort_order: number;
};

type MemberDraft = {
  id: string | null;
  name: string;
  engName: string;
  roleKo: string;
  roleEn: string;
  roleJa: string;
  birth: string;
  mbti: string;
  imageUrl: string;
  color: string;
  bioKo: string;
  bioEn: string;
  bioJa: string;
  socialLinks: SocialLink[];
};

type MemberTab = "basic" | "profile" | "content" | "social" | "gallery";

const EMPTY_MEMBER: MemberDraft = {
  id: null,
  name: "",
  engName: "",
  roleKo: "",
  roleEn: "",
  roleJa: "",
  birth: "",
  mbti: "",
  imageUrl: "",
  color: BRAND_PINK_HEX,
  bioKo: "",
  bioEn: "",
  bioJa: "",
  socialLinks: [],
};

const toSlug = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const tabs: WorkbenchTab<MemberTab>[] = [
  { id: "basic", label: "기본 정보" },
  { id: "profile", label: "프로필" },
  { id: "content", label: "소개" },
  { id: "social", label: "공식 계정" },
  { id: "gallery", label: "갤러리" },
];

const fromMember = (member: Member): MemberDraft => ({
  id: member.id,
  name: member.name || "",
  engName: member.eng_name || "",
  roleKo: member.role_ko || "",
  roleEn: member.role_en || "",
  roleJa: member.role_ja || "",
  birth: member.birth || "",
  mbti: member.mbti || "",
  imageUrl: member.image_url || "",
  color: member.color || BRAND_PINK_HEX,
  bioKo: member.bio_ko || "",
  bioEn: member.bio_en || "",
  bioJa: member.bio_ja || "",
  socialLinks: normalizeSocialLinks(member.social_links),
});

export default function ArtistMembersAdmin() {
  const routeArtistId = useParams<{ id: string }>()?.id;
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
  } = useAdminCrud<MemberDraft>({ initialDraft: null });
  const uploadedAssets = useRef<UploadedImageAsset[]>([]);

  useEffect(() => { void cleanupAbandonedDraftImageAssets(supabase); }, []);

  const canSave = Boolean(draft?.name.trim() && draft.engName.trim() && toSlug(draft.engName) && /^#[0-9a-f]{6}$/i.test(draft.color) && !hasInvalidSocialLinks(draft.socialLinks) && (draft.id || draft.roleKo.trim()));
  const previewMemberSlug = draft ? toSlug(draft.engName) : "";
  const previewMemberId = draft?.id || newMemberId || "";
  const previewPayload = useMemo(() => draft && artistId && artistSlug && previewMemberSlug && previewMemberId ? {
    artist: { id: artistId, slug: artistSlug, name: artistName },
    member: {
      id: previewMemberId,
      slug: previewMemberSlug,
      name: draft.name,
      eng_name: draft.engName || null,
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
      sort_order: Math.max(1, members.findIndex((member) => member.id === draft.id) + 1 || members.length + 1),
    },
  } : null, [artistId, artistName, artistSlug, draft, members, previewMemberId, previewMemberSlug]);
  const { openPreview } = useAdminPreview({
    kind: "artist-member",
    payload: previewPayload,
    targetPath: artistSlug && previewMemberSlug ? `/${artistSlug}/artist/${previewMemberSlug}` : "",
    canPreview: Boolean(previewPayload),
    unavailableMessage: "????? ??? ?? ???? ???? ?? ??? ?????.",
    onError: setError,
  });

  const discardQueuedUploads = useCallback(async () => {
    const queued = uploadedAssets.current;
    uploadedAssets.current = [];
    await discardDraftImageAssets(supabase, queued);
  }, []);


  const loadMembers = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    const { data: artist, error: artistError } = await supabase.from("artists").select("id,name,slug").eq("id", routeArtistId).single();
    if (artistError || !artist) {
      setError("아티스트 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const { data, error: memberError } = await supabase.from("artist_members").select("*").eq("artist_id", artist.id).order("sort_order", { ascending: true });
    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }
    const nextMembers = (data as Member[] | null) ?? [];
    const selected = nextMembers.find((member) => member.id === preferredId) ?? nextMembers[0] ?? null;
    setArtistId(artist.id);
    setArtistName(artist.name || "아티스트");
    setArtistSlug(artist.slug || "");
    setMembers(nextMembers);
    setNewMemberId(null);
    if (selected) {
      const nextDraft = fromMember(selected);
      setDraft(nextDraft);
      setSnapshot(JSON.stringify(nextDraft));
    } else {
      setDraft(null);
      setSnapshot("");
    }
    setLoading(false);
  }, [routeArtistId, setDraft, setError, setLoading, setSnapshot]);

  useEffect(() => { void Promise.resolve().then(() => loadMembers()); }, [loadMembers]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || sortDirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, sortDirty]);

  const selectMember = async (member: Member) => {
    if (sorting) return;
    if (dirty && !await requestConfirm({
      title: "변경사항을 버릴까요?",
      description: "현재 멤버에서 저장하지 않은 내용이 사라집니다. 다른 멤버를 열기 전에 한 번 더 확인해 주세요.",
      confirmLabel: "버리고 열기",
      tone: "danger",
    })) return;
    const nextDraft = fromMember(member);
    await discardQueuedUploads();
    setNewMemberId(null);
    setDraft(nextDraft);
    setSnapshot(JSON.stringify(nextDraft));
    setTab("basic");
    setError("");
  };

  const addMember = async () => {
    if (dirty && !await requestConfirm({
      title: "새 멤버를 만들까요?",
      description: "현재 멤버에서 저장하지 않은 내용이 사라지고 새 멤버 작성 화면으로 이동합니다.",
      confirmLabel: "버리고 새로 만들기",
      tone: "danger",
    })) return;
    setNewMemberId(crypto.randomUUID());
    await discardQueuedUploads();
    setDraft({ ...EMPTY_MEMBER });
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
    const originalDraft = snapshot ? JSON.parse(snapshot) as MemberDraft : null;
    const payload = {
      artist_id: artistId,
      name: draft.name,
      eng_name: draft.engName,
      slug: toSlug(draft.engName),
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
      ? await supabase.from("artist_members").update(payload).eq("id", draft.id).select("id").single()
      : await supabase.from("artist_members").insert({ id: pendingId, ...payload, sort_order: members.length + 1 }).select("id").single();
    if (result.error) {
      setError(result.error.code === "23505" ? "같은 영문명으로 생성된 공개 경로가 이미 사용 중입니다." : result.error.message.includes("column of 'artist_members' in the schema cache") ? "멤버 프로필 DB 컬럼이 누락되었습니다. 최신 007_artist_profile_schema.sql을 적용한 뒤 다시 저장하세요." : result.error.message.includes("social_links") ? "공식 계정 컬럼이 없습니다. 005_artist_social_links.sql을 먼저 적용하세요." : result.error.message);
      setSaving(false);
      return;
    }
    setToast(draft.id ? "멤버 정보를 저장했습니다." : "새 멤버를 추가했습니다.");
    await loadMembers(result.data.id);
    await finalizeDraftImageAssets(
      supabase,
      uploadedAssets.current,
      [draft.imageUrl],
      originalDraft ? [originalDraft.imageUrl] : [],
    );
    uploadedAssets.current = [];
    setSaving(false);
  };

  const removeMember = async () => {
    if (!draft?.id) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from("artist_members").delete().eq("id", draft.id);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(deleteError.message);
      return;
    }
    setDeleteOpen(false);
    setToast("멤버를 삭제했습니다.");
    await loadMembers();
  };

  const reorderMember = (targetId: string) => {
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
    const results = await Promise.all(members.map((member, index) => supabase.from("artist_members").update({ sort_order: index + 1 }).eq("id", member.id)));
    setSaving(false);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    setSorting(false);
    setSortDirty(false);
    setToast("멤버 노출 순서를 저장했습니다.");
    await loadMembers(draft?.id || undefined);
  };

  if (loading) return <LoadingIndicator label="멤버 라이브러리를 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  const rail = <>
    <div className="content-rail-heading">
      <div><h2>멤버 라이브러리</h2></div>
      <button type="button" onClick={() => void addMember()} aria-label="멤버 추가"><LuPlus aria-hidden="true" /></button>
    </div>
    <div className="content-rail-sort"><span>{members.length}명</span>{members.length > 1 && <button type="button" onClick={() => { setSorting((value) => !value); setSortDirty(false); }}>{sorting ? "정렬 취소" : "순서 변경"}</button>}</div>
    <div className="content-library-list member-library-list">
      {draft && !draft.id && <button type="button" className="content-library-item is-selected"><span className="content-library-index">NEW</span><span className="content-library-thumb"><i style={{ background: draft.color }} /></span><span className="content-library-copy"><b>{draft.name || "새 멤버"}</b><small>{draft.roleKo || "기본 정보를 입력하세요"}</small></span></button>}
      {members.map((member, index) => <button
        key={member.id}
        type="button"
        draggable={sorting}
        onDragStart={() => setDragMember(member.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => reorderMember(member.id)}
        onClick={() => void selectMember(member)}
        className={`content-library-item ${draft?.id === member.id ? "is-selected" : ""} ${sorting ? "is-sorting" : ""}`}
      >
        <span className="content-library-index">{sorting ? "↕" : String(index + 1).padStart(2, "0")}</span>
        <span className="content-library-thumb">{member.image_url ? <img src={member.image_url} alt="" /> : <i style={{ background: member.color || BRAND_PINK_HEX }} />}</span>
        <span className="content-library-copy"><b>{member.name}</b><small>{member.role_ko || member.eng_name || "역할 미설정"}</small></span>
      </button>)}
      {!members.length && !draft && <div className="content-library-empty"><b>등록된 멤버가 없습니다.</b><span>첫 멤버를 추가해 아티스트 라인업을 구성하세요.</span></div>}
    </div>
    {sorting && <div className="content-rail-footer"><button type="button" className="admin-btn admin-btn-primary" disabled={!sortDirty || saving} onClick={() => void saveOrder()}>{saving ? "저장 중…" : "순서 저장"}</button></div>}
  </>;

  const identity = draft ? <>
    <span className="content-identity-art">{draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <i style={{ background: draft.color }} />}</span>
    <div className="content-identity-copy"><p><span className={`cms-status ${draft.id ? "is-live" : ""}`}>{draft.id ? "등록됨" : "신규"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p><h2>{draft.name || "이름 없는 멤버"}</h2></div>
  </> : <div className="content-identity-copy"><p><span className="cms-status">선택 안 됨</span></p><h2>멤버를 선택하세요</h2><small>{artistName}</small></div>;

  const actions = draft ? <>{draft.id && <button type="button" className="content-delete-action" onClick={() => setDeleteOpen(true)}>삭제</button>}<PreviewButton onClick={openPreview} disabled={!previewPayload} /><button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || saving} onClick={() => void saveMember()}>{saving ? "저장 중…" : "변경사항 저장"}</button></> : <button type="button" className="admin-btn admin-btn-primary" onClick={() => void addMember()}>첫 멤버 추가</button>;

  return <><ContentWorkbench rail={rail} identity={identity} actions={actions} tabs={tabs} activeTab={tab} onTabChange={setTab} error={error} onDismissError={() => setError("")} toast={toast} className="member-workbench">
    {!draft ? <div className="content-no-selection"><span><LuUserRound aria-hidden="true" /></span><h2>멤버를 선택하세요</h2><p>왼쪽 라이브러리에서 멤버를 선택하거나 새 멤버를 추가할 수 있습니다.</p><button type="button" className="admin-btn admin-btn-primary" onClick={() => void addMember()}>첫 멤버 추가</button></div> : <div className="content-editor-stack">
      {tab === "basic" && <>
        <div className="content-section-heading"><h3>멤버 기본 정보</h3><span>프로필과 멤버 목록에서 사용하는 이름과 역할입니다.</span></div>
        <div className="music-field-grid two"><label className="music-field"><span>이름 (한국어) <b>*</b></span><input className="admin-input" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} autoFocus /></label><label className="music-field"><span>이름 (영문) <b>*</b></span><input className="admin-input" value={draft.engName} onChange={(event) => patchDraft({ engName: event.target.value })} /></label></div>
        <label className="music-field content-field-short"><span>공개 경로</span><input className="admin-input" value={`/${toSlug(draft.engName) || "english-name"}`} readOnly /><small>영문명을 기준으로 자동 생성됩니다.</small></label>
        <div className="music-divider" />
        <FormField label="역할 / 포지션" valueKo={draft.roleKo} valueEn={draft.roleEn} valueJa={draft.roleJa} onChangeKo={(value) => patchDraft({ roleKo: value })} onChangeEn={(value) => patchDraft({ roleEn: value })} onChangeJa={(value) => patchDraft({ roleJa: value })} required />
      </>}
      {tab === "profile" && <>
        <div className="content-section-heading"><h3>프로필 비주얼</h3><span>멤버를 식별하는 이미지와 기본 프로필 정보를 설정합니다.</span></div>
        <ImageAssetField label="멤버 프로필 이미지" hint="선택 사항입니다. 드래그앤드롭하거나 파일을 선택하세요." value={draft.imageUrl} artistKey={artistId} entityKey={draft.id || newMemberId || "new-member"} kind="member-profile" shape="portrait" onChange={handleMemberImageChange} onUploaded={(asset) => { uploadedAssets.current.push(asset); trackDraftImageAsset(asset); }} onError={setError} />
        <div className="music-field-grid two"><label className="music-field"><span>생년월일</span><input className="admin-input" value={draft.birth} onChange={(event) => patchDraft({ birth: event.target.value })} placeholder="2004. 05. 25" /></label><label className="music-field"><span>MBTI</span><input className="admin-input" value={draft.mbti} onChange={(event) => patchDraft({ mbti: event.target.value.toUpperCase() })} placeholder="ESFP" /></label></div>
        <label className="music-field content-field-short"><span>테마 컬러</span><div className="content-color-row"><input type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /><input className="admin-input" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /></div></label>
      </>}
      {tab === "content" && <>
        <div className="content-section-heading"><h3>멤버 소개</h3><span>멤버 페이지에서 보여줄 소개를 언어별로 입력합니다.</span></div>
        <FormField label="멤버 소개" type="textarea" valueKo={draft.bioKo} valueEn={draft.bioEn} valueJa={draft.bioJa} onChangeKo={(value) => patchDraft({ bioKo: value })} onChangeEn={(value) => patchDraft({ bioEn: value })} onChangeJa={(value) => patchDraft({ bioJa: value })} />
        <div className="content-publish-summary"><div><span>멤버</span><strong>{draft.name || "미입력"} / {draft.engName || "미입력"}</strong></div><div><span>역할</span><strong>{draft.roleKo || "미입력"}</strong></div><div><span>공개 경로</span><strong>{toSlug(draft.engName) ? `/${toSlug(draft.engName)}` : "영문명 입력 필요"}</strong></div><div><span>프로필</span><strong>{draft.birth || "생년월일 미설정"} · {draft.mbti || "MBTI 미설정"}</strong></div></div>
      </>}
      {tab === "social" && <>
        <div className="content-section-heading"><h3>멤버 공식 계정</h3><span>멤버 개인의 공식 채널과 음악 플랫폼 계정을 등록합니다. 필요한 만큼 자유롭게 추가할 수 있습니다.</span></div>
        <SocialLinksField value={draft.socialLinks} onChange={(socialLinks) => patchDraft({ socialLinks })} />
      </>}
      {tab === "gallery" && <>
        <div className="content-section-heading"><h3>멤버 갤러리</h3><span>이 멤버의 이미지를 모으고, 관련 앨범을 함께 지정합니다.</span></div>
        <GalleryManager artistId={artistId || null} scope="member" memberId={draft.id} onError={setError} onToast={setToast} />
      </>}
    </div>}
  </ContentWorkbench>{deleteOpen && draft?.id && <DeleteConfirmDialog title="멤버를 삭제할까요?" description="멤버 프로필이 목록과 공개 페이지에서 제거됩니다. 이 작업은 되돌릴 수 없습니다." confirmValue={draft.name} valueLabel="멤버명" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => void removeMember()} />}</>;
}
