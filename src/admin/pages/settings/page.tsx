"use client";

import { type DragEvent, useId, useState } from "react";
import type { IconType } from "react-icons";
import { Building2, Check, FileArchive, FileText, Globe, History, Mail, Plus, Settings2, Share2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import PreviewButton from "@/admin/components/content/PreviewButton";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import FormField from "@/admin/components/content/FormField";
import SocialLinksField from "@/admin/components/content/SocialLinksField";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { safeHref } from "@/core/http/safe-href";
import { SOCIAL_ICONS } from "@/core/content/social-icons";
import type { HistoryEntry } from "@/core/content/site-content";
import { settingsTabs, type HistoryLanguage, type SettingsTab } from "./settings-editor-model";
import AdminAccountsPanel from "./AdminAccountsPanel";
import AvatarAssetManager from "./AvatarAssetManager";
import { useSettingsEditor } from "./useSettingsEditor";

function BusinessAssetField({ label, hint, accept, icon: Icon, value, busy, onUpload }: {
  label: string;
  hint: string;
  accept: string;
  icon: IconType;
  value: string;
  busy: boolean;
  onUpload: (file: File) => void;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const upload = (file?: File) => { if (file && !busy) onUpload(file); };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  };
  const href = safeHref(value);

  return <div className={`track-asset-field ${value ? "has-file" : ""} ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={drop}>
    <span className="track-asset-icon"><Icon aria-hidden="true" /></span>
    <span className="track-asset-copy"><b>{label}</b><small>{busy ? "업로드 중…" : dragging ? "여기에 놓아 업로드" : value ? "업로드 완료" : hint}</small></span>
    {href && <a href={href} target="_blank" rel="noreferrer">보기</a>}
    <label htmlFor={inputId}>{value ? "교체" : "업로드"}</label>
    <input id={inputId} className="sr-only" type="file" accept={accept} disabled={busy} onChange={(event) => { upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
  </div>;
}

export default function SettingsAdmin({ canManageAdminAccounts = false }: { canManageAdminAccounts?: boolean }) {
  const {
    loading, saving, tab, setTab, company, setCompany, history, setHistory, historyLanguage, setHistoryLanguage,
    footer, setFooter, social, setSocial, business, avatarDirty, setAvatarDirty, snapshot, error, setError,
    toast, setToast, isSuperAdmin, showToast, draft, settingsDirty, dirty, recovery, restoreBackup, discardBackup,
    nestedDrafts, openPreview, historyEventKey, patchHistory, addHistory, uploadBusinessAsset, handleSave,
    sortHistoryNewestFirst,
  } = useSettingsEditor(canManageAdminAccounts);

  if (loading) return <AdminSkeleton variant="workbench" className="min-h-[420px]" />;

  const companyReady = Boolean(company.email.trim() || company.address_ko.trim() || company.address_en.trim() || company.address_ja.trim());
  const historyReady = history.length > 0;
  const footerReady = Boolean(footer.copyright.trim());
  const socialCount = social.length;

  const railItems: Array<{ id: SettingsTab; label: string; copy: string; icon: IconType; ready: boolean; meta: string }> = [
    { id: "company", label: "회사 정보", copy: "주소 · 대표 메일", icon: Building2, ready: companyReady, meta: companyReady ? "입력 완료" : "확인 필요" },
    { id: "history", label: "연혁", copy: "ABOUT 성장 기록", icon: History, ready: historyReady, meta: `${history.length}개 항목` },
    { id: "footer", label: "푸터", copy: "하단 저작권 문구", icon: Globe, ready: footerReady, meta: footerReady ? "입력 완료" : "확인 필요" },
    { id: "social", label: "소셜 채널", copy: "공식 채널 바로가기", icon: Share2, ready: socialCount > 0, meta: `${socialCount}개 연결` },
    { id: "business", label: "비즈니스 자료", copy: "프레스킷 · 프로필 PDF", icon: FileArchive, ready: Boolean(business.pressKitUrl || business.profilePdfUrl), meta: business.pressKitUrl && business.profilePdfUrl ? "업로드 완료" : "자료 확인 필요" },
    { id: "avatars", label: "사용자 아바타", copy: "아티스트별 계정 이미지", icon: UserRound, ready: !avatarDirty, meta: avatarDirty ? "저장 필요" : "목록 관리" },
    ...(isSuperAdmin ? [{ id: "admins" as const, label: "관리자 계정", copy: "초대 · 역할 · 권한 해제", icon: ShieldCheck, ready: true, meta: "슈퍼 관리자" }] : []),
  ];

  const rail = (
    <div className="settings-context-rail">
      <div className="content-rail-heading">
        <div><h2>사이트 설정</h2></div>
        <span className={`settings-sync-dot ${dirty ? "is-dirty" : ""}`} aria-label={dirty ? "저장 필요" : "동기화됨"} />
      </div>
      <div className="settings-rail-summary">
        <Settings2 aria-hidden="true" />
        <p>공개 사이트 전반에서 함께 사용하는 기본 정보를 관리합니다.</p>
      </div>
      <nav className="settings-rail-nav" aria-label="사이트 설정 섹션">
        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>
              <span><Icon aria-hidden="true" /></span>
              <div><b>{item.label}</b><small>{item.copy}</small></div>
              <em className={item.ready ? "is-ready" : ""}>{item.ready && <Check aria-hidden="true" />}{item.meta}</em>
            </button>
          );
        })}
      </nav>
    </div>
  );

  const identity = <>
    <span className="content-identity-art settings-identity-art"><Settings2 aria-hidden="true" /></span>
    <div className="content-identity-copy">
      {dirty && <p><em>저장하지 않은 변경사항</em></p>}
      <h2>사이트 공통 설정</h2>
    </div>
  </>;

  return (
    <ContentWorkbench
      rail={rail}
      railLabel="설정 선택"
      identity={identity}
      actions={tab === "admins" ? null : <>{tab !== "avatars" && <PreviewButton onClick={openPreview} />}<DraftSaveButton snapshot={snapshot} draft={draft} dirty={settingsDirty || nestedDrafts.dirty} saving={saving} extraDiff={nestedDrafts.diff} onSave={async () => { if (settingsDirty) await handleSave(); await nestedDrafts.commit(); }} /></>}
      tabs={(isSuperAdmin ? settingsTabs : settingsTabs.filter((item) => item.id !== "admins")).map((item) => ({ ...item, complete: railItems.find((railItem) => railItem.id === item.id)?.ready, missing: railItems.find((railItem) => railItem.id === item.id)?.ready ? 0 : 1 }))}
      activeTab={tab}
      onTabChange={setTab}
      error={error}
      onDismissError={() => setError("")}
      toast={toast}
      className="settings-workbench"
      recovery={recovery ? { updatedAt: recovery.updatedAt, onRestore: restoreBackup, onDiscard: discardBackup } : null}
    >
      <div className="content-editor-stack settings-editor-stack">
        {tab === "company" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>회사 정보</h3><p>회사명은 기존 값을 유지하고, 사이트에 표시할 주소와 대표 연락처만 관리합니다.</p></div><Building2 aria-hidden="true" /></div>
          <section className="settings-panel">
            <FormField label="주소" valueKo={company.address_ko} valueEn={company.address_en} valueJa={company.address_ja} onChangeKo={(value) => setCompany({ ...company, address_ko: value })} onChangeEn={(value) => setCompany({ ...company, address_en: value })} onChangeJa={(value) => setCompany({ ...company, address_ja: value })} />
            <div className="settings-panel-divider" />
            <label className="music-field content-field-short"><span>대표 이메일</span><div className="settings-input-with-icon"><Mail aria-hidden="true" /><input type="email" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} className="admin-input" placeholder="contact@example.com" /></div><small>방문자가 회사에 연락할 때 사용하는 공개 이메일입니다.</small></label>
          </section>
        </>}

        {tab === "history" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>ABOUT 연혁</h3><p>공개 ABOUT 페이지에 표시할 성장 기록을 관리합니다. 현재 목록 순서대로 사이트에 노출됩니다.</p></div><History aria-hidden="true" /></div>
          <div className="settings-history-toolbar" data-tour-id="settings-history-actions">
            <span>총 {history.length}개 항목 · 최신순 자동 정렬</span>
            <div className="settings-history-tools">
              <div className="settings-history-languages" aria-label="연혁 편집 언어">
                {(["ko", "en", "ja"] as HistoryLanguage[]).map((language) => <button key={language} type="button" className={historyLanguage === language ? "is-active" : ""} onClick={() => setHistoryLanguage(language)}>{language.toUpperCase()}</button>)}
              </div>
              <button type="button" data-tour-id="history-add" className="admin-btn admin-btn-secondary" onClick={addHistory}><Plus aria-hidden="true" /> 연혁 추가</button>
            </div>
          </div>
          <div className="settings-history-columns" aria-hidden="true"><span>순서</span><span>시점</span><span>{historyLanguage.toUpperCase()} 내용</span><span>관리</span></div>
          <section className="settings-history-list">
            {history.map((item, index) => (
              <article key={item.id} className="settings-history-item">
                <span className="settings-history-order">{String(index + 1).padStart(2, "0")}</span>
                <label><span className="sr-only">시점</span><input value={item.date} onChange={(event) => patchHistory(item.id, { date: event.target.value })} onBlur={() => setHistory((items) => sortHistoryNewestFirst(items))} className="settings-history-date" placeholder="2026. 07" /></label>
                <label><span className="sr-only">{historyLanguage.toUpperCase()} 내용</span><input value={item[historyEventKey]} onChange={(event) => patchHistory(item.id, { [historyEventKey]: event.target.value } as Partial<HistoryEntry>)} className="settings-history-event" placeholder={historyLanguage === "ko" ? "연혁 내용을 입력하세요" : `${historyLanguage.toUpperCase()} 번역을 입력하세요`} /></label>
                <div className="settings-history-actions">
                  <button type="button" data-tour-id="history-delete" className="is-danger" onClick={() => setHistory((items) => items.filter((entry) => entry.id !== item.id))} aria-label="연혁 삭제"><Trash2 aria-hidden="true" /></button>
                </div>
              </article>
            ))}
            {!history.length && <div className="settings-history-empty"><History aria-hidden="true" /><b>등록된 연혁이 없습니다.</b><span>연혁 추가 버튼으로 첫 기록을 만들어 주세요.</span></div>}
          </section>
        </>}

        {tab === "footer" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>푸터</h3><p>모든 공개 페이지 하단에 반복해서 표시되는 저작권 문구입니다.</p></div><Globe aria-hidden="true" /></div>
          <section className="settings-panel">
            <label className="music-field"><span>저작권 문구</span><input value={footer.copyright} onChange={(event) => setFooter({ copyright: event.target.value })} className="admin-input" placeholder="© THE MUZE ENTERTAINMENT. ALL RIGHTS RESERVED." /><small>연도와 회사명을 포함한 최종 문구를 입력해 주세요.</small></label>
          </section>
          <section className="settings-footer-preview" aria-label="푸터 미리보기">
            <div><strong>{company.name_en || company.name_ko || "THE MUZE"}</strong></div>
            <p>{footer.copyright || "저작권 문구가 이곳에 표시됩니다."}</p>
            <div className="settings-footer-socials">{social.map((item) => { const Icon = SOCIAL_ICONS[item.platform] || Globe; return <Icon key={item.id} aria-label={item.label || item.platform} />; })}</div>
          </section>
        </>}

        {tab === "social" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>소셜 채널</h3><p>사이트 전역에서 연결할 회사 공식 채널 주소를 관리합니다.</p></div><Share2 aria-hidden="true" /></div>
          <SocialLinksField value={social} onChange={setSocial} />
        </>}

        {tab === "business" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>비즈니스 자료</h3><p>Contact Business 탭에서 공개할 프레스킷 ZIP과 프로필 PDF입니다. ZIP은 서버에서 압축을 풀지 않습니다.</p></div><FileArchive aria-hidden="true" /></div>
          <section className="settings-panel">
            <BusinessAssetField label="프레스킷 ZIP" hint="ZIP · 최대 100MB · 드래그하거나 파일을 선택하세요" accept=".zip,application/zip" icon={FileArchive} value={business.pressKitUrl} busy={saving} onUpload={(file) => void uploadBusinessAsset("pressKitUrl", file)} />
            <BusinessAssetField label="프로필 PDF" hint="PDF · 최대 100MB · 드래그하거나 파일을 선택하세요" accept=".pdf,application/pdf" icon={FileText} value={business.profilePdfUrl} busy={saving} onUpload={(file) => void uploadBusinessAsset("profilePdfUrl", file)} />
          </section>
        </>}

        <AvatarAssetManager active={tab === "avatars"} onDirtyChange={setAvatarDirty} onError={setError} onToast={showToast} />

        {tab === "admins" && isSuperAdmin && <AdminAccountsPanel onError={setError} onSuccess={(message) => {
          setToast(message);
          window.setTimeout(() => setToast(""), 2600);
        }} />}
      </div>
    </ContentWorkbench>
  );
}
