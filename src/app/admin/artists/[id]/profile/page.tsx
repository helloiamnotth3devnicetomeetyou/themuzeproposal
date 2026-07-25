"use client";

import { BRAND_PINK_HEX } from "@/lib/design-tokens";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuCheck, LuMinus } from "react-icons/lu";
import ContentWorkbench, { type WorkbenchTab } from "@/components/admin/ContentWorkbench";
import ArtistSceneManager from "@/components/admin/ArtistSceneManager";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import FormField from "@/components/admin/FormField";
import GalleryManager from "@/components/admin/GalleryManager";
import ImageAssetField from "@/components/admin/ImageAssetField";
import SocialLinksField, { hasInvalidSocialLinks, normalizeSocialLinks, type SocialLink } from "@/components/admin/SocialLinksField";
import CustomSelect from "@/components/ui/CustomSelect";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useAdminCrud } from "@/app/admin/_hooks/useAdminCrud";
import { supabase } from "@/lib/supabase";
import { notifyArtistsChanged } from "@/lib/artist-events";

type ProfileTab = "basic" | "visual" | "content" | "social" | "scenes" | "gallery" | "publish";

type ProfileDraft = {
  name: string;
  engName: string;
  type: string;
  debutDate: string;
  imageUrl: string;
  logoUrl: string;
  color: string;
  descKo: string;
  descEn: string;
  descJa: string;
  socialLinks: SocialLink[];
  isActive: boolean;
};

const EMPTY_PROFILE: ProfileDraft = {
  name: "",
  engName: "",
  type: "group",
  debutDate: "",
  imageUrl: "",
  logoUrl: "",
  color: BRAND_PINK_HEX,
  descKo: "",
  descEn: "",
  descJa: "",
  socialLinks: [],
  isActive: true,
};

const tabs: WorkbenchTab<ProfileTab>[] = [
  { id: "basic", label: "기본 정보" },
  { id: "visual", label: "비주얼" },
  { id: "content", label: "소개" },
  { id: "social", label: "공식 계정" },
  { id: "scenes", label: "인터랙티브 장면" },
  { id: "gallery", label: "갤러리" },
  { id: "publish", label: "공개 설정" },
];

const toSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ArtistProfileAdmin() {
  const routeId = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const heroCollapseRef = useRef(0);
  const isNew = routeId === "new";
  const [artistId, setArtistId] = useState<string | null>(() => isNew ? crypto.randomUUID() : null);
  const [tab, setTab] = useState<ProfileTab>("basic");

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
  } = useAdminCrud<ProfileDraft>({ initialDraft: isNew ? EMPTY_PROFILE : null });

  const serializedDraft = useMemo(() => draft ? JSON.stringify(draft) : "", [draft]);
  void serializedDraft; // kept for forward-compat; dirty now derived from hook

  const saveIssues = useMemo(() => {
    const issues: string[] = [];
    if (!draft.name.trim()) issues.push("한국어 아티스트명");
    if (!draft.engName.trim()) issues.push("영문 아티스트명");
    if (!toSlug(draft.engName)) issues.push("영문명 기반 공개 경로");
    if (!/^#[0-9a-f]{6}$/i.test(draft.color)) issues.push("테마 컬러");
    if (hasInvalidSocialLinks(draft.socialLinks)) issues.push("공식 계정 링크");
    return issues;
  }, [draft]);

  const completion = [
    { label: "이름과 기본 정보", ready: Boolean(draft.name && draft.engName && toSlug(draft.engName)) },
    { label: "대표 이미지와 컬러", ready: Boolean(draft.imageUrl && /^#[0-9a-f]{6}$/i.test(draft.color)) },
    { label: "한국어 아티스트 소개", ready: Boolean(draft.descKo.trim()) },
    { label: "공개 상태 확인", ready: true },
  ];

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      const { data, error: loadError } = await supabase.from("artists").select("*").eq("id", routeId).single();
      if (cancelled) return;
      if (loadError || !data) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      const nextDraft: ProfileDraft = {
        name: data.name || "",
        engName: data.eng_name || "",
        type: data.type || "group",
        debutDate: data.debut_date || "",
        imageUrl: data.image_url || "",
        logoUrl: data.logo_url || "",
        color: data.color || BRAND_PINK_HEX,
        descKo: data.description_ko || "",
        descEn: data.description_en || "",
        descJa: data.description_ja || "",
        socialLinks: normalizeSocialLinks(data.social_links),
        isActive: data.is_active ?? true,
      };
      setArtistId(data.id);
      setDraft(nextDraft);
      setSnapshot(JSON.stringify(nextDraft));
      setLoading(false);
    }
    void Promise.resolve().then(loadProfile);
    return () => { cancelled = true; };
  }, [isNew, routeId, setDraft, setSnapshot, setError, setLoading]);

  const handleEnglishName = (value: string) => {
    patchDraft({ engName: value });
  };

  const handleProfileAssetChange = async (field: "imageUrl" | "logoUrl", value: string) => {
    patchDraft({ [field]: value } as Pick<ProfileDraft, typeof field>);
    if (!artistId || isNew) return;
    setError("");
    const column = field === "imageUrl" ? "image_url" : "logo_url";
    const { error: assetError } = await supabase.from("artists").update({ [column]: value || null }).eq("id", artistId);
    if (assetError) {
      setError(assetError.message.includes("logo_url") ? "아티스트 로고 컬럼이 없습니다. 004_artist_assets.sql을 먼저 적용하세요." : assetError.message);
      return;
    }
    setSnapshot((current) => {
      const saved = JSON.parse(current) as ProfileDraft;
      return JSON.stringify({ ...saved, [field]: value });
    });
    notifyArtistsChanged();
    setToast(value ? "이미지를 업로드하고 저장했습니다." : "이미지를 제거했습니다.");
  };

  const handleSave = async () => {
    if (saveIssues.length || !artistId) {
      setError(`필수 정보를 확인하세요: ${saveIssues.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      slug: toSlug(draft.engName),
      name: draft.name,
      eng_name: draft.engName,
      type: draft.type,
      debut_date: draft.debutDate || null,
      image_url: draft.imageUrl || null,
      logo_url: draft.logoUrl || null,
      color: draft.color.toUpperCase(),
      description_ko: draft.descKo,
      description_en: draft.descEn,
      description_ja: draft.descJa,
      social_links: draft.socialLinks,
      is_active: draft.isActive,
    };
    const result = isNew
      ? await supabase.from("artists").insert({ id: artistId, ...payload }).select("id").single()
      : await supabase.from("artists").update(payload).eq("id", artistId).select("id").single();
    setSaving(false);
    if (result.error) {
      setError(result.error.code === "23505" ? "같은 영문명으로 생성된 공개 경로가 이미 사용 중입니다." : result.error.message.includes("column of 'artists' in the schema cache") ? "아티스트 프로필 DB 컬럼이 누락되었습니다. 최신 007_artist_profile_schema.sql을 적용한 뒤 다시 저장하세요." : result.error.message.includes("social_links") ? "공식 계정 컬럼이 없습니다. 005_artist_social_links.sql을 먼저 적용하세요." : result.error.message.includes("logo_url") ? "아티스트 로고 컬럼이 없습니다. 004_artist_assets.sql을 먼저 적용하세요." : result.error.message);
      return;
    }
    setArtistId(result.data.id);
    setSnapshot(serializedDraft);
    notifyArtistsChanged();
    setToast(isNew ? "아티스트를 만들었습니다." : "변경사항을 저장했습니다.");
    if (routeId !== result.data.id) router.replace(`/admin/artists/${result.data.id}/profile`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!artistId || isNew) return;
    setDeleting(true);
    setError("");
    const { error: deleteError } = await supabase.from("artists").delete().eq("id", artistId);
    setDeleting(false);
    if (deleteError) {
      setDeleteOpen(false);
      setError(deleteError.message);
      return;
    }
    notifyArtistsChanged();
    router.replace("/admin");
    router.refresh();
  };

  useEffect(() => {
    const body = editorBodyRef.current;
    if (!body || loading) return;

    const setHeroCollapse = (shell: HTMLElement, collapse: number, maximum: number) => {
      heroCollapseRef.current = collapse;
      shell.style.setProperty("--profile-hero-collapse", `${collapse}px`);
      shell.classList.toggle("is-hero-compact", collapse > maximum * 0.55);
    };

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.deltaY) return;
      const shell = body.closest(".profile-workbench") as HTMLElement | null;
      if (!shell) return;

      const maximum = window.innerWidth <= 560 ? 92 : window.innerWidth <= 850 ? 109 : 128;
      const current = Math.min(heroCollapseRef.current, maximum);

      if (event.deltaY > 0) {
        const remainingOverflow = Math.max(0, body.scrollHeight - body.clientHeight);
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

  if (loading) return <LoadingIndicator label="아티스트 프로필을 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  const rail = (
    <div className="profile-context-rail">
      <div className="profile-context-portrait" style={{ "--artist-color": draft.color } as CSSProperties}>
        {draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <div><span>프로필 이미지</span>{draft.engName && <b>{draft.engName.slice(0, 2)}</b>}</div>}
      </div>
      <div className="profile-context-copy">
        <p>{draft.name || "아티스트 이름"}</p>
        <strong>{draft.engName || "ENGLISH NAME"}</strong>
      </div>
      <div className="profile-completion">
        <p>프로필 준비 상태</p>
        {completion.map((item) => <div key={item.label} className={item.ready ? "is-ready" : ""}><i>{item.ready ? <LuCheck aria-hidden="true" /> : <LuMinus aria-hidden="true" />}</i><span>{item.label}</span></div>)}
      </div>
      {isNew && <button type="button" className="content-rail-quiet-action" onClick={() => router.push("/admin")}>작성 취소</button>}
    </div>
  );

  const identity = <>
    <span className="content-identity-art">{draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <i style={{ background: draft.color }} />}</span>
    <div className="content-identity-copy">
      <p><span className={`cms-status ${draft.isActive ? "is-live" : ""}`}>{draft.isActive ? "공개" : "비공개"}</span>{dirty && <em>저장하지 않은 변경사항</em>}</p>
      <h2>{draft.name || "이름 없는 아티스트"}</h2>
    </div>
  </>;

  return (
    <>
    <ContentWorkbench
      rail={rail}
      identity={identity}
      actions={<>{!isNew && <button type="button" className="content-delete-action" onClick={() => setDeleteOpen(true)}>삭제</button>}<button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || saving} onClick={() => void handleSave()}>{saving ? "저장 중…" : isNew ? "아티스트 만들기" : "변경사항 저장"}</button></>}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      bodyRef={editorBodyRef}
      error={error}
      onDismissError={() => setError("")}
      toast={toast}
      className="profile-workbench"
    >
      <div className="content-editor-stack">
        {tab === "basic" && <>
          <div className="content-section-heading"><h3>아티스트 기본 정보</h3><span>공개 페이지와 관리자 목록에서 사용하는 이름과 고유 ID입니다.</span></div>
          <div className="music-field-grid two">
            <label className="music-field"><span>아티스트명 (한국어) <b>*</b></span><input className="admin-input" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} autoFocus /></label>
            <label className="music-field"><span>아티스트명 (영문) <b>*</b></span><input className="admin-input" value={draft.engName} onChange={(event) => handleEnglishName(event.target.value)} /></label>
          </div>
          <div className="music-field-grid two">
            <label className="music-field"><span>공개 경로</span><input className="admin-input" value={`/${toSlug(draft.engName) || "english-name"}`} readOnly /><small>영문명을 기준으로 자동 생성됩니다.</small></label>
            <div className="music-field"><span>유형</span><CustomSelect ariaLabel="아티스트 유형" value={draft.type} onChange={(type) => patchDraft({ type })} options={[{ value: "group", label: "그룹" }, { value: "solo", label: "솔로" }]} /></div>
          </div>
          <label className="music-field content-field-short"><span>데뷔일</span><input type="date" className="admin-input" value={draft.debutDate} onChange={(event) => patchDraft({ debutDate: event.target.value })} /></label>
        </>}

        {tab === "visual" && <>
          <div className="content-section-heading"><h3>대표 비주얼</h3><span>아티스트를 식별하는 이미지와 테마 컬러를 설정합니다.</span></div>
          <div className="content-asset-grid">
            <ImageAssetField label="프로필 이미지" hint="드래그앤드롭하거나 파일을 선택하세요. 공개 프로필에서는 원본 비율을 유지해 표시됩니다." value={draft.imageUrl} artistKey={artistId || "new-artist"} entityKey={artistId || "new-artist"} kind="artist-profile" shape="portrait" onChange={(imageUrl) => handleProfileAssetChange("imageUrl", imageUrl)} onError={setError} />
            <ImageAssetField label="아티스트 로고" hint="SVG 또는 투명 배경 PNG·WebP를 권장합니다. SVG는 서버에서 안전성 검사 후 저장됩니다." value={draft.logoUrl} artistKey={artistId || "new-artist"} entityKey={artistId || "new-artist"} kind="artist-logo" shape="logo" onChange={(logoUrl) => handleProfileAssetChange("logoUrl", logoUrl)} onError={setError} />
          </div>
          <label className="music-field content-field-short"><span>테마 컬러 <b>*</b></span><div className="content-color-row"><input type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /><input className="admin-input" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} /></div></label>
        </>}

        {tab === "content" && <>
          <div className="content-section-heading"><h3>아티스트 소개</h3><span>한국어 소개는 필수이며 영문과 일본어는 준비되었을 때 추가할 수 있습니다.</span></div>
          <FormField label="아티스트 소개" type="textarea" valueKo={draft.descKo} valueEn={draft.descEn} valueJa={draft.descJa} onChangeKo={(value) => patchDraft({ descKo: value })} onChangeEn={(value) => patchDraft({ descEn: value })} onChangeJa={(value) => patchDraft({ descJa: value })} />
        </>}

        {tab === "social" && <>
          <div className="content-section-heading"><h3>아티스트 공식 계정</h3><span>공개 프로필에 연결할 공식 채널과 음악 플랫폼을 등록합니다. 필요한 만큼 자유롭게 추가할 수 있습니다.</span></div>
          <SocialLinksField value={draft.socialLinks} onChange={(socialLinks) => patchDraft({ socialLinks })} />
        </>}

        {tab === "scenes" && <>
          <div className="content-section-heading"><h3>인터랙티브 멤버 장면</h3><span>한 화면 안에서 전환할 콘셉트 이미지와 멤버별 정밀 실루엣을 편집합니다.</span></div>
          <ArtistSceneManager artistId={artistId} heroUrl={draft.imageUrl} onError={setError} onToast={setToast} />
        </>}

        {tab === "gallery" && <>
          <div className="content-section-heading"><h3>아티스트 통합 갤러리</h3><span>앨범과 멤버에 등록된 이미지를 한곳에서 보고, 두 분류를 교차해 정리합니다.</span></div>
          <GalleryManager artistId={artistId} scope="artist" onError={setError} onToast={setToast} />
        </>}

        {tab === "publish" && <>
          <div className="content-section-heading"><h3>공개 설정</h3><span>저장 후 사이트 메뉴와 아티스트 프로필에 표시할지 선택합니다.</span></div>
          <div className="content-publish-summary">
            <div><span>아티스트</span><strong>{draft.name || "미입력"} / {draft.engName || "미입력"}</strong></div>
            <div><span>테마 컬러</span><strong>{draft.color}</strong></div>
            <div><span>유형 · 데뷔일</span><strong>{draft.type === "group" ? "그룹" : "솔로"} · {draft.debutDate || "미설정"}</strong></div>
            <div><span>필수 정보</span><strong>{saveIssues.length ? `${saveIssues.length}개 확인 필요` : "저장 준비 완료"}</strong></div>
          </div>
          <div className="content-choice-grid">
            <label className="content-choice"><input type="radio" checked={draft.isActive} onChange={() => patchDraft({ isActive: true })} /><span><b>바로 공개</b><small>사이트 메뉴와 프로필에 표시합니다.</small></span></label>
            <label className="content-choice"><input type="radio" checked={!draft.isActive} onChange={() => patchDraft({ isActive: false })} /><span><b>비공개로 저장</b><small>준비가 끝난 뒤 공개할 수 있습니다.</small></span></label>
          </div>
        </>}
      </div>
    </ContentWorkbench>
    {deleteOpen && <DeleteConfirmDialog title="아티스트를 삭제할까요?" description="아티스트와 연결된 콘텐츠가 함께 삭제되거나 삭제가 제한될 수 있습니다. 이 작업은 되돌릴 수 없습니다." confirmValue={draft.name} valueLabel="아티스트명" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => void handleDelete()} />}
    </>
  );
}
