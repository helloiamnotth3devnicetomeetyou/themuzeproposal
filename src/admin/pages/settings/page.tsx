"use client";

import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { LuBuilding2, LuCheck, LuGlobe, LuHistory, LuMail, LuPlus, LuSettings2, LuShare2, LuTrash2 } from "react-icons/lu";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import PreviewButton from "@/admin/components/content/PreviewButton";
import FormField from "@/admin/components/content/FormField";
import SocialLinksField, { hasInvalidSocialLinks, type SocialLink } from "@/admin/components/content/SocialLinksField";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { supabase } from "@/core/supabase/client";
import { useAdminPreview } from "@/admin/hooks/useAdminPreview";
import { SOCIAL_ICONS } from "@/core/content/social-icons";
import { DEFAULT_HISTORY, normalizeHistory, sortHistoryNewestFirst, type HistoryEntry } from "@/core/content/site-content";
import {
  EMPTY_COMPANY,
  EMPTY_DRAFT,
  EMPTY_FOOTER,
  EMPTY_SOCIAL,
  normalizeSiteSocial,
  settingsTabs,
  type CompanySettings,
  type FooterSettings,
  type HistoryLanguage,
  type SettingsTab,
} from "./settings-editor-model";

export default function SettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("company");
  const [company, setCompany] = useState<CompanySettings>(EMPTY_COMPANY);
  const [history, setHistory] = useState<HistoryEntry[]>(DEFAULT_HISTORY);
  const [historyLanguage, setHistoryLanguage] = useState<HistoryLanguage>("ko");
  const [footer, setFooter] = useState<FooterSettings>(EMPTY_FOOTER);
  const [social, setSocial] = useState<SocialLink[]>(EMPTY_SOCIAL);
  const [snapshot, setSnapshot] = useState(JSON.stringify(EMPTY_DRAFT));
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const draft = useMemo(() => ({ company, history, footer, social }), [company, history, footer, social]);
  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft]);
  const dirty = serializedDraft !== snapshot;
  const previewTarget = tab === "company"
    ? "/about?section=company#about-company"
    : tab === "history"
      ? "/about?section=history#about-history"
      : `/about?section=${tab}#site-footer`;
  const { openPreview } = useAdminPreview({
    kind: "site-settings",
    payload: draft,
    targetPath: previewTarget,
    canPreview: true,
    unavailableMessage: "??? ?? ????? ? ? ????.",
    onError: setError,
  });

  const historyEventKey: "event_ko" | "event_en" | "event_ja" = `event_${historyLanguage}`;

  useEffect(() => {
    let active = true;

    const fetchSettings = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase.from("site_settings").select("*");
      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      let nextCompany = EMPTY_COMPANY;
      let nextHistory = DEFAULT_HISTORY;
      let nextFooter = EMPTY_FOOTER;
      let nextSocial: SocialLink[] = EMPTY_SOCIAL;
      data?.forEach((item) => {
        if (item.key === "company") nextCompany = { ...EMPTY_COMPANY, ...(item.value as Partial<CompanySettings>) };
        if (item.key === "history") nextHistory = normalizeHistory(item.value);
        if (item.key === "footer") nextFooter = { ...EMPTY_FOOTER, ...(item.value as Partial<FooterSettings>) };
        if (item.key === "social") nextSocial = normalizeSiteSocial(item.value);
      });

      const nextDraft = { company: nextCompany, history: nextHistory, footer: nextFooter, social: nextSocial };
      setCompany(nextCompany);
      setHistory(nextHistory);
      setFooter(nextFooter);
      setSocial(nextSocial);
      setSnapshot(JSON.stringify(nextDraft));
      setLoading(false);
    };

    void fetchSettings();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUrlTab = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SettingsTab;
      if (tabParam && ["company", "history", "footer", "social"].includes(tabParam)) {
        setTab(tabParam);
      }
    };

    handleUrlTab();

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as SettingsTab;
      if (detail && ["company", "history", "footer", "social"].includes(detail)) {
        setTab(detail);
      }
    };

    window.addEventListener("admin-settings-tab-change", handleCustomEvent);
    return () => {
      window.removeEventListener("admin-settings-tab-change", handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [dirty]);

  const patchHistory = (id: string, patch: Partial<HistoryEntry>) => {
    setHistory((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addHistory = () => {
    const next: HistoryEntry = {
      id: `history-${Date.now()}`,
      date: "",
      event_ko: "",
      event_en: "",
      event_ja: "",
    };
    setHistory((items) => [next, ...items]);
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
    ];
    const { error: saveError } = await supabase.from("site_settings").upsert(updates as never[]);
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSnapshot(serializedDraft);
    setToast("사이트 설정을 저장했습니다.");
    window.setTimeout(() => setToast(""), 2600);
  };

  if (loading) return <LoadingIndicator label="사이트 설정을 불러오는 중…" className="min-h-[420px] bg-[var(--bg-card)]" />;

  const companyReady = Boolean(company.email.trim() || company.address_ko.trim() || company.address_en.trim() || company.address_ja.trim());
  const historyReady = history.length > 0;
  const footerReady = Boolean(footer.copyright.trim());
  const socialCount = social.length;

  const railItems: Array<{ id: SettingsTab; label: string; copy: string; icon: IconType; ready: boolean; meta: string }> = [
    { id: "company", label: "회사 정보", copy: "주소 · 대표 메일", icon: LuBuilding2, ready: companyReady, meta: companyReady ? "입력 완료" : "확인 필요" },
    { id: "history", label: "연혁", copy: "ABOUT 성장 기록", icon: LuHistory, ready: historyReady, meta: `${history.length}개 항목` },
    { id: "footer", label: "푸터", copy: "하단 저작권 문구", icon: LuGlobe, ready: footerReady, meta: footerReady ? "입력 완료" : "확인 필요" },
    { id: "social", label: "소셜 채널", copy: "공식 채널 바로가기", icon: LuShare2, ready: socialCount > 0, meta: `${socialCount}개 연결` },
  ];

  const rail = (
    <div className="settings-context-rail">
      <div className="content-rail-heading">
        <div><h2>사이트 설정</h2></div>
        <span className={`settings-sync-dot ${dirty ? "is-dirty" : ""}`} aria-label={dirty ? "저장 필요" : "동기화됨"} />
      </div>
      <div className="settings-rail-summary">
        <LuSettings2 aria-hidden="true" />
        <p>공개 사이트 전반에서 함께 사용하는 기본 정보를 관리합니다.</p>
      </div>
      <nav className="settings-rail-nav" aria-label="사이트 설정 섹션">
        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>
              <span><Icon aria-hidden="true" /></span>
              <div><b>{item.label}</b><small>{item.copy}</small></div>
              <em className={item.ready ? "is-ready" : ""}>{item.ready && <LuCheck aria-hidden="true" />}{item.meta}</em>
            </button>
          );
        })}
      </nav>
    </div>
  );

  const identity = <>
    <span className="content-identity-art settings-identity-art"><LuSettings2 aria-hidden="true" /></span>
    <div className="content-identity-copy">
      {dirty && <p><em>저장하지 않은 변경사항</em></p>}
      <h2>사이트 공통 설정</h2>
    </div>
  </>;

  return (
    <ContentWorkbench
      rail={rail}
      identity={identity}
      actions={<><PreviewButton onClick={openPreview} /><button type="button" className="admin-btn admin-btn-primary" disabled={!dirty || saving} onClick={() => void handleSave()}>{saving ? "저장 중…" : "변경사항 저장"}</button></>}
      tabs={settingsTabs}
      activeTab={tab}
      onTabChange={setTab}
      error={error}
      onDismissError={() => setError("")}
      toast={toast}
      className="settings-workbench"
    >
      <div className="content-editor-stack settings-editor-stack">
        {tab === "company" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>회사 정보</h3><p>회사명은 기존 값을 유지하고, 사이트에 표시할 주소와 대표 연락처만 관리합니다.</p></div><LuBuilding2 aria-hidden="true" /></div>
          <section className="settings-panel">
            <FormField label="주소" valueKo={company.address_ko} valueEn={company.address_en} valueJa={company.address_ja} onChangeKo={(value) => setCompany({ ...company, address_ko: value })} onChangeEn={(value) => setCompany({ ...company, address_en: value })} onChangeJa={(value) => setCompany({ ...company, address_ja: value })} />
            <div className="settings-panel-divider" />
            <label className="music-field content-field-short"><span>대표 이메일</span><div className="settings-input-with-icon"><LuMail aria-hidden="true" /><input type="email" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} className="admin-input" placeholder="contact@example.com" /></div><small>방문자가 회사에 연락할 때 사용하는 공개 이메일입니다.</small></label>
          </section>
        </>}

        {tab === "history" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>ABOUT 연혁</h3><p>공개 ABOUT 페이지에 표시할 성장 기록을 관리합니다. 현재 목록 순서대로 사이트에 노출됩니다.</p></div><LuHistory aria-hidden="true" /></div>
          <div className="settings-history-toolbar">
            <span>총 {history.length}개 항목 · 최신순 자동 정렬</span>
            <div className="settings-history-tools">
              <div className="settings-history-languages" aria-label="연혁 편집 언어">
                {(["ko", "en", "ja"] as HistoryLanguage[]).map((language) => <button key={language} type="button" className={historyLanguage === language ? "is-active" : ""} onClick={() => setHistoryLanguage(language)}>{language.toUpperCase()}</button>)}
              </div>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={addHistory}><LuPlus aria-hidden="true" /> 연혁 추가</button>
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
                  <button type="button" className="is-danger" onClick={() => setHistory((items) => items.filter((entry) => entry.id !== item.id))} aria-label="연혁 삭제"><LuTrash2 aria-hidden="true" /></button>
                </div>
              </article>
            ))}
            {!history.length && <div className="settings-history-empty"><LuHistory aria-hidden="true" /><b>등록된 연혁이 없습니다.</b><span>연혁 추가 버튼으로 첫 기록을 만들어 주세요.</span></div>}
          </section>
        </>}

        {tab === "footer" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>푸터</h3><p>모든 공개 페이지 하단에 반복해서 표시되는 저작권 문구입니다.</p></div><LuGlobe aria-hidden="true" /></div>
          <section className="settings-panel">
            <label className="music-field"><span>저작권 문구</span><input value={footer.copyright} onChange={(event) => setFooter({ copyright: event.target.value })} className="admin-input" placeholder="© THE MUZE ENTERTAINMENT. ALL RIGHTS RESERVED." /><small>연도와 회사명을 포함한 최종 문구를 입력해 주세요.</small></label>
          </section>
          <section className="settings-footer-preview" aria-label="푸터 미리보기">
            <div><strong>{company.name_en || company.name_ko || "THE MUZE"}</strong></div>
            <p>{footer.copyright || "저작권 문구가 이곳에 표시됩니다."}</p>
            <div className="settings-footer-socials">{social.map((item) => { const Icon = SOCIAL_ICONS[item.platform] || LuGlobe; return <Icon key={item.id} aria-label={item.label || item.platform} />; })}</div>
          </section>
        </>}

        {tab === "social" && <>
          <div className="content-section-heading settings-section-heading"><div><h3>소셜 채널</h3><p>사이트 전역에서 연결할 회사 공식 채널 주소를 관리합니다.</p></div><LuShare2 aria-hidden="true" /></div>
          <SocialLinksField value={social} onChange={setSocial} />
        </>}
      </div>
    </ContentWorkbench>
  );
}
