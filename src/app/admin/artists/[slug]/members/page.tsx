"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import FormField from "@/components/admin/FormField";
import Wizard from "@/components/admin/Wizard";
import Image from "next/image";

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
  sort_order: number;
};

export default function ArtistMembersAdmin() {
  const params = useParams();
  const slug = params?.slug as string;

  const [artistId, setArtistId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [engName, setEngName] = useState("");
  const [memberSlug, setMemberSlug] = useState("");
  const [roleKo, setRoleKo] = useState(""); const [roleEn, setRoleEn] = useState(""); const [roleJa, setRoleJa] = useState("");
  const [birth, setBirth] = useState("");
  const [mbti, setMbti] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("#FC6FCF");
  const [bioKo, setBioKo] = useState(""); const [bioEn, setBioEn] = useState(""); const [bioJa, setBioJa] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    async function loadMembers() {
      const { data: artist } = await supabase.from("artists").select("id").eq("slug", slug).single();
      if (!artist) { if (!cancelled) setLoading(false); return; }
      const { data } = await supabase.from("artist_members").select("*").eq("artist_id", artist.id).order("sort_order", { ascending: true });
      if (!cancelled) {
        setArtistId(artist.id);
        setMembers((data as Member[] | null) ?? []);
        setLoading(false);
      }
    }
    void loadMembers();
    return () => { cancelled = true; };
  }, [slug]);

  async function fetchMembers() {
    setLoading(true);
    const { data: artist } = await supabase.from("artists").select("id").eq("slug", slug).single();
    if (artist) {
      setArtistId(artist.id);
      const { data } = await supabase
        .from("artist_members")
        .select("*")
        .eq("artist_id", artist.id)
        .order("sort_order", { ascending: true });
      if (data) setMembers(data as Member[]);
    }
    setLoading(false);
  }

  const handleEdit = (member: Member) => {
    setCurrentId(member.id);
    setName(member.name || ""); setEngName(member.eng_name || ""); setMemberSlug(member.slug || "");
    setRoleKo(member.role_ko || ""); setRoleEn(member.role_en || ""); setRoleJa(member.role_ja || "");
    setBirth(member.birth || ""); setMbti(member.mbti || ""); setImageUrl(member.image_url || ""); setColor(member.color || "#FC6FCF");
    setBioKo(member.bio_ko || ""); setBioEn(member.bio_en || ""); setBioJa(member.bio_ja || "");
    setStep(0); setError(null);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentId(null);
    setName(""); setEngName(""); setMemberSlug("");
    setRoleKo(""); setRoleEn(""); setRoleJa("");
    setBirth(""); setMbti(""); setImageUrl(""); setColor("#FC6FCF");
    setBioKo(""); setBioEn(""); setBioJa("");
    setStep(0); setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setCurrentId(null); };

  const handleSave = async () => {
    if (!artistId) return;
    setSaving(true);
    const payload = {
      artist_id: artistId,
      name, eng_name: engName, slug: memberSlug,
      role_ko: roleKo, role_en: roleEn, role_ja: roleJa,
      birth, mbti, image_url: imageUrl, color,
      bio_ko: bioKo, bio_en: bioEn, bio_ja: bioJa,
    };
    const result = currentId
      ? await supabase.from("artist_members").update(payload).eq("id", currentId)
      : await supabase.from("artist_members").insert([{ ...payload, sort_order: members.length + 1 }]);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setIsEditing(false); fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this member?")) {
      await supabase.from("artist_members").delete().eq("id", id);
      fetchMembers();
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const current = members[index];
    const prev = members[index - 1];
    await Promise.all([
      supabase.from("artist_members").update({ sort_order: prev.sort_order }).eq("id", current.id),
      supabase.from("artist_members").update({ sort_order: current.sort_order }).eq("id", prev.id)
    ]);
    fetchMembers();
  };

  const moveDown = async (index: number) => {
    if (index === members.length - 1) return;
    const current = members[index];
    const next = members[index + 1];
    await Promise.all([
      supabase.from("artist_members").update({ sort_order: next.sort_order }).eq("id", current.id),
      supabase.from("artist_members").update({ sort_order: current.sort_order }).eq("id", next.id)
    ]);
    fetchMembers();
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>;

  if (isEditing) {
    return (
      <Wizard
        title={currentId ? "멤버 정보 수정" : "새 멤버 추가"}
        description="기본 정보, 프로필 비주얼, 소개를 순서대로 입력하세요."
        steps={[{ title: "기본 정보", description: "이름과 역할" }, { title: "프로필", description: "이미지와 정보" }, { title: "확인", description: "소개와 검토" }]}
        step={step}
        canContinue={step === 0 ? Boolean(name.trim() && engName.trim() && memberSlug.trim() && roleKo.trim()) : step === 1 ? Boolean(imageUrl.trim()) : true}
        busy={saving}
        error={error}
        completeLabel={currentId ? "변경사항 저장" : "멤버 추가"}
        onStepChange={(next) => { setError(null); setStep(next); }}
        onCancel={handleCancel}
        onComplete={handleSave}
      >
        {step === 0 && <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>멤버 기본 정보</h3><p>프로필과 멤버 목록에서 사용할 이름과 역할을 입력합니다.</p></div>
          <div className="cms-field-grid three"><div className="cms-field"><label>이름 (한국어)<span>*</span></label><input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div><div className="cms-field"><label>이름 (영문)<span>*</span></label><input className="admin-input" value={engName} onChange={(e) => setEngName(e.target.value)} /></div><div className="cms-field"><label>멤버 ID<span>*</span></label><input className="admin-input" value={memberSlug} onChange={(e) => setMemberSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /></div></div>
          <FormField label="역할 / 포지션" valueKo={roleKo} valueEn={roleEn} valueJa={roleJa} onChangeKo={setRoleKo} onChangeEn={setRoleEn} onChangeJa={setRoleJa} required />
        </div>}
        {step === 1 && <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>프로필 비주얼</h3><p>멤버 이미지와 기본 프로필 정보를 설정합니다.</p></div>
          <div className="cms-image-field"><div className="cms-wizard-section"><div className="cms-field"><label>프로필 이미지 URL<span>*</span></label><input className="admin-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></div><div className="cms-field-grid"><div className="cms-field"><label>생년월일</label><input className="admin-input" value={birth} onChange={(e) => setBirth(e.target.value)} placeholder="2004. 05. 25" /></div><div className="cms-field"><label>MBTI</label><input className="admin-input" value={mbti} onChange={(e) => setMbti(e.target.value.toUpperCase())} placeholder="ESFP" /></div></div><div className="cms-field"><label>테마 컬러</label><div className="cms-color-row"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><input className="admin-input" value={color} onChange={(e) => setColor(e.target.value)} /></div></div></div><div className="cms-image-preview">{imageUrl ? <Image src={imageUrl} alt="멤버 미리보기" fill className="object-cover" /> : <div className="cms-image-placeholder">이미지 미리보기</div>}</div></div>
        </div>}
        {step === 2 && <div className="cms-wizard-section">
          <div className="cms-wizard-section-header"><h3>소개 및 최종 확인</h3><p>소개를 입력하고 저장할 멤버 정보를 확인하세요.</p></div>
          <FormField label="멤버 소개" type="textarea" valueKo={bioKo} valueEn={bioEn} valueJa={bioJa} onChangeKo={setBioKo} onChangeEn={setBioEn} onChangeJa={setBioJa} />
          <div className="cms-review"><div><span>멤버</span><strong>{name} / {engName}</strong></div><div><span>역할</span><strong>{roleKo}</strong></div><div><span>멤버 ID</span><strong>{memberSlug}</strong></div><div><span>프로필</span><strong>{birth || "생년월일 미설정"} · {mbti || "MBTI 미설정"}</strong></div></div>
        </div>}
      </Wizard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold capitalize" style={{ color: "var(--text-primary)" }}>{slug} 멤버</h1>
        <button onClick={handleAddNew} className="admin-btn admin-btn-primary">+ 멤버 추가</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-16 text-center">Order</th>
              <th>Member</th>
              <th>Role</th>
              <th>MBTI</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, idx) => (
              <tr key={m.id}>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-xs transition-opacity hover:opacity-60 disabled:opacity-20" style={{ color: "var(--text-primary)" }}>▲</button>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</span>
                    <button onClick={() => moveDown(idx)} disabled={idx === members.length - 1} className="text-xs transition-opacity hover:opacity-60 disabled:opacity-20" style={{ color: "var(--text-primary)" }}>▼</button>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative bg-subtle" style={{ border: `1px solid var(--border-subtle)` }}>
                      {m.image_url && <Image src={m.image_url} alt={m.name} fill className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                      <p className="text-[10px] uppercase font-mono" style={{ color: "var(--text-faint)" }}>{m.eng_name}</p>
                    </div>
                  </div>
                </td>
                <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.role_ko}</td>
                <td>
                  {m.mbti && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                      {m.mbti}
                    </span>
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(m)} className="text-xs mr-3" style={{ color: "var(--text-muted)" }}>Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs" style={{ color: "var(--text-faint)" }}>Delete</button>
                </td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No members.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
