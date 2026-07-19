"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import FormField from "@/components/admin/FormField";
import Wizard from "@/components/admin/Wizard";
import { supabase } from "@/lib/supabase";

const steps = [
  { title: "기본 정보", description: "이름과 URL" },
  { title: "비주얼", description: "이미지와 컬러" },
  { title: "소개", description: "다국어 콘텐츠" },
  { title: "확인", description: "공개 전 검토" },
];

const toSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ArtistProfileAdmin() {
  const params = useParams();
  const router = useRouter();
  const routeSlug = params?.slug as string;
  const isNew = routeSlug === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [engName, setEngName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [type, setType] = useState("group");
  const [debutDate, setDebutDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("#FC6FCF");
  const [descKo, setDescKo] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descJa, setDescJa] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function loadProfile() {
      const { data, error: loadError } = await supabase.from("artists").select("*").eq("slug", routeSlug).single();
      if (cancelled) return;
      if (loadError || !data) {
        setError("아티스트 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }
      setArtistId(data.id);
      setName(data.name || "");
      setEngName(data.eng_name || "");
      setArtistSlug(data.slug || routeSlug);
      setType(data.type || "group");
      setDebutDate(data.debut_date || "");
      setImageUrl(data.image_url || "");
      setColor(data.color || "#FC6FCF");
      setDescKo(data.description_ko || "");
      setDescEn(data.description_en || "");
      setDescJa(data.description_ja || "");
      setIsActive(data.is_active ?? true);
      setLoading(false);
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, [isNew, routeSlug]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(name.trim() && engName.trim() && /^[a-z0-9-]+$/.test(artistSlug));
    if (step === 1) return /^#[0-9a-f]{6}$/i.test(color);
    if (step === 2) return Boolean(descKo.trim());
    return true;
  }, [step, name, engName, artistSlug, color, descKo]);

  const handleEnglishName = (value: string) => {
    setEngName(value);
    if (isNew && !artistSlug) setArtistSlug(toSlug(value));
  };

  const handleSave = async () => {
    if (!canContinue || (!isNew && !artistId)) return;
    setSaving(true);
    setError(null);
    const payload = {
      slug: artistSlug,
      name,
      eng_name: engName,
      type,
      debut_date: debutDate || null,
      image_url: imageUrl || null,
      color,
      description_ko: descKo,
      description_en: descEn,
      description_ja: descJa,
      is_active: isActive,
    };
    const result = isNew
      ? await supabase.from("artists").insert(payload).select("id, slug").single()
      : await supabase.from("artists").update(payload).eq("id", artistId!).select("id, slug").single();
    setSaving(false);
    if (result.error) {
      setError(result.error.code === "23505" ? "이미 사용 중인 아티스트 ID입니다." : result.error.message);
      return;
    }
    router.replace(`/admin/artists/${result.data.slug}/profile`);
    router.refresh();
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>아티스트 정보를 불러오는 중...</p>;

  return (
    <Wizard
      title={isNew ? "새 아티스트 추가" : `${name || routeSlug} 프로필 수정`}
      description={isNew ? "필수 정보부터 공개 설정까지 순서대로 입력하세요." : "프로필 정보를 단계별로 검토하고 수정하세요."}
      steps={steps}
      step={step}
      canContinue={canContinue}
      busy={saving}
      error={error}
      completeLabel={isNew ? "아티스트 만들기" : "변경사항 저장"}
      onStepChange={(next) => { setError(null); setStep(next); }}
      onCancel={() => router.push("/admin")}
      onComplete={handleSave}
    >
      {step === 0 && (
        <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>아티스트 기본 정보</h3><p>관리자와 공개 페이지에서 사용할 이름과 고유 주소를 입력합니다.</p></div>
          <div className="cms-field-grid">
            <div className="cms-field"><label>아티스트명 (한국어)<span>*</span></label><input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 리센느" autoFocus /></div>
            <div className="cms-field"><label>아티스트명 (영문)<span>*</span></label><input className="admin-input" value={engName} onChange={(e) => handleEnglishName(e.target.value)} placeholder="예: RESCENE" /></div>
          </div>
          <div className="cms-field-grid">
            <div className="cms-field"><label>아티스트 ID<span>*</span></label><input className="admin-input" value={artistSlug} onChange={(e) => setArtistSlug(toSlug(e.target.value))} placeholder="rescene" /><small>영문 소문자, 숫자, 하이픈만 가능하며 공개 URL에 사용됩니다.</small></div>
            <div className="cms-field"><label>유형</label><select className="admin-input" value={type} onChange={(e) => setType(e.target.value)}><option value="group">그룹</option><option value="solo">솔로</option></select></div>
          </div>
          <div className="cms-field"><label>데뷔일</label><input type="date" className="admin-input" value={debutDate} onChange={(e) => setDebutDate(e.target.value)} /></div>
        </div>
      )}

      {step === 1 && (
        <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>대표 비주얼</h3><p>프로필과 목록에서 사용할 이미지와 아티스트 테마 컬러를 설정합니다.</p></div>
          <div className="cms-image-field">
            <div className="cms-wizard-section">
              <div className="cms-field"><label>프로필 이미지 URL</label><input className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://... 또는 /images/..." /><small>이미지는 나중에 추가해도 됩니다.</small></div>
              <div className="cms-field"><label>테마 컬러<span>*</span></label><div className="cms-color-row"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><input className="admin-input" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} /></div></div>
            </div>
            <div className="cms-image-preview">{imageUrl ? <Image src={imageUrl} alt="프로필 미리보기" fill className="object-cover" /> : <div className="cms-image-placeholder">이미지 미리보기</div>}</div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>아티스트 소개</h3><p>한국어 소개는 필수이며, 영문과 일본어는 준비되었을 때 추가할 수 있습니다.</p></div>
          <FormField label="아티스트 소개" type="textarea" valueKo={descKo} valueEn={descEn} valueJa={descJa} onChangeKo={setDescKo} onChangeEn={setDescEn} onChangeJa={setDescJa} required />
        </div>
      )}

      {step === 3 && (
        <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>저장 전 확인</h3><p>입력한 정보와 공개 상태를 마지막으로 확인하세요.</p></div>
          <div className="cms-review">
            <div><span>아티스트</span><strong>{name} / {engName}</strong></div>
            <div><span>공개 URL</span><strong>/{artistSlug}/artist</strong></div>
            <div><span>유형 · 데뷔일</span><strong>{type === "group" ? "그룹" : "솔로"} · {debutDate || "미설정"}</strong></div>
            <div><span>테마 컬러</span><strong>{color}</strong></div>
          </div>
          <div className="cms-choice-row">
            <label className="cms-choice"><input type="radio" checked={isActive} onChange={() => setIsActive(true)} /><span><b>바로 공개</b><small>사이트 메뉴와 프로필에 표시합니다.</small></span></label>
            <label className="cms-choice"><input type="radio" checked={!isActive} onChange={() => setIsActive(false)} /><span><b>비공개로 저장</b><small>준비가 끝난 뒤 공개할 수 있습니다.</small></span></label>
          </div>
        </div>
      )}
    </Wizard>
  );
}
