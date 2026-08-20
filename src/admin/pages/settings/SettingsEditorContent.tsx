"use client";

import {
  Building2,
  FileArchive,
  FileText,
  Globe,
  History,
  Mail,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import AdminAccountsPanel from "./AdminAccountsPanel";
import AvatarAssetManager from "./AvatarAssetManager";
import BusinessAssetField from "./BusinessAssetField";
import LoginSlidesField from "./LoginSlidesField";
import FormField from "@/admin/components/content/FormField";
import SocialLinksField from "@/admin/components/content/SocialLinksField";
import { SocialIcon } from "@/core/content/SocialIcon";
import {
  sortHistoryNewestFirst,
  type HistoryEntry,
} from "@/core/content/site-content";
import type { useSettingsEditor } from "./useSettingsEditor";

type SettingsEditorState = ReturnType<typeof useSettingsEditor>;

export default function SettingsEditorContent({
  editor,
}: {
  editor: SettingsEditorState;
}) {
  const {
    tab,
    company,
    setCompany,
    historyLanguage,
    history,
    setHistory,
    patchHistory,
    addHistory,
    historyEventKey,
    footer,
    setFooter,
    social,
    setSocial,
    business,
    loginSlides,
    setLoginSlides,
    saving,
    uploadBusinessAsset,
    setAvatarDirty,
    setError,
    showToast,
    isSuperAdmin,
    setToast,
  } = editor;

  return (
    <div className="content-editor-stack settings-editor-stack">
      {tab === "company" && (
        <>
          <div className="content-section-heading settings-section-heading">
            <div>
              <h3>회사 정보</h3>
              <p>
                회사명은 기존 값을 유지하고, 사이트에 표시할 주소와 대표
                연락처만 관리합니다.
              </p>
            </div>
            <Building2 aria-hidden="true" />
          </div>
          <section className="settings-panel">
            <FormField
              activeLang={historyLanguage}
              label="주소"
              valueKo={company.address_ko}
              valueEn={company.address_en}
              valueJa={company.address_ja}
              onChangeKo={(value) =>
                setCompany({ ...company, address_ko: value })
              }
              onChangeEn={(value) =>
                setCompany({ ...company, address_en: value })
              }
              onChangeJa={(value) =>
                setCompany({ ...company, address_ja: value })
              }
            />
            <div className="settings-panel-divider" />
            <label className="music-field content-field-short">
              <span>대표 이메일</span>
              <div className="settings-input-with-icon">
                <Mail aria-hidden="true" />
                <input
                  type="email"
                  value={company.email}
                  onChange={(event) =>
                    setCompany({ ...company, email: event.target.value })
                  }
                  className="admin-input"
                  placeholder="contact@example.com"
                />
              </div>
              <small>방문자가 회사에 연락할 때 사용하는 공개 이메일입니다.</small>
            </label>
          </section>
        </>
      )}

      {tab === "history" && (
        <>
          <div className="content-section-heading settings-section-heading">
            <div>
              <h3>ABOUT 연혁</h3>
              <p>
                공개 ABOUT 페이지에 표시할 성장 기록을 관리합니다. 현재 목록
                순서대로 사이트에 노출됩니다.
              </p>
            </div>
            <History aria-hidden="true" />
          </div>
          <div
            className="settings-history-toolbar"
            data-tour-id="settings-history-actions"
          >
            <span>총 {history.length}개 항목</span>
            <div className="settings-history-tools">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() =>
                  setHistory((items) => sortHistoryNewestFirst(items))
                }
              >
                최신순 정렬
              </button>
              <button
                type="button"
                data-tour-id="history-add"
                className="admin-btn admin-btn-secondary"
                onClick={addHistory}
              >
                <Plus aria-hidden="true" /> 연혁 추가
              </button>
            </div>
          </div>
          <div className="settings-history-columns" aria-hidden="true">
            <span>순서</span>
            <span>시점</span>
            <span>{historyLanguage.toUpperCase()} 내용</span>
            <span>관리</span>
          </div>
          <section className="settings-history-list">
            {history.map((item, index) => (
              <article key={item.id} className="settings-history-item">
                <span className="settings-history-order">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <label>
                  <span className="sr-only">시점</span>
                  <input
                    value={item.date}
                    onChange={(event) =>
                      patchHistory(item.id, { date: event.target.value })
                    }
                    className="settings-history-date"
                    placeholder="2026. 07"
                  />
                </label>
                <label>
                  <span className="sr-only">
                    {historyLanguage.toUpperCase()} 내용
                  </span>
                  <input
                    value={item[historyEventKey]}
                    onChange={(event) =>
                      patchHistory(item.id, {
                        [historyEventKey]: event.target.value,
                      } as Partial<HistoryEntry>)
                    }
                    className="settings-history-event"
                    placeholder={
                      historyLanguage === "ko"
                        ? "연혁 내용을 입력하세요"
                        : `${historyLanguage.toUpperCase()} 번역을 입력하세요`
                    }
                  />
                </label>
                <div className="settings-history-actions">
                  <button
                    type="button"
                    data-tour-id="history-delete"
                    className="is-danger"
                    onClick={() =>
                      setHistory((items) =>
                        items.filter((entry) => entry.id !== item.id),
                      )
                    }
                    aria-label="연혁 삭제"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
            {!history.length && (
              <div className="settings-history-empty">
                <History aria-hidden="true" />
                <b>등록된 연혁이 없습니다.</b>
                <span>연혁 추가 버튼으로 첫 기록을 만들어 주세요.</span>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "footer" && (
        <>
          <div className="content-section-heading settings-section-heading">
            <div>
              <h3>푸터</h3>
              <p>모든 공개 페이지 하단에 반복해서 표시되는 저작권 문구입니다.</p>
            </div>
            <Globe aria-hidden="true" />
          </div>
          <section className="settings-panel">
            <label className="music-field">
              <span>저작권 문구</span>
              <input
                value={footer.copyright}
                onChange={(event) =>
                  setFooter({ copyright: event.target.value })
                }
                className="admin-input"
                placeholder="© THE MUZE ENTERTAINMENT. ALL RIGHTS RESERVED."
              />
              <small>연도와 회사명을 포함한 최종 문구를 입력해 주세요.</small>
            </label>
          </section>
          <section
            className="settings-footer-preview"
            aria-label="푸터 미리보기"
          >
            <div>
              <strong>{company.name_en || company.name_ko || "THE MUZE"}</strong>
            </div>
            <p>{footer.copyright || "저작권 문구가 이곳에 표시됩니다."}</p>
            <div className="settings-footer-socials">
              {social.map((item) => (
                <SocialIcon
                  key={item.id}
                  platform={item.platform}
                  aria-label={item.label || item.platform}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "social" && (
        <>
          <div className="content-section-heading settings-section-heading">
            <div>
              <h3>소셜 채널</h3>
              <p>사이트 전역에서 연결할 회사 공식 채널 주소를 관리합니다.</p>
            </div>
            <Share2 aria-hidden="true" />
          </div>
          <SocialLinksField value={social} onChange={setSocial} />
        </>
      )}

      {tab === "business" && (
        <>
          <div className="content-section-heading settings-section-heading">
            <div>
              <h3>비즈니스 자료</h3>
              <p>
                Contact Business 탭에서 공개할 프레스킷 ZIP과 프로필 PDF입니다.
                ZIP은 서버에서 압축을 풀지 않습니다.
              </p>
            </div>
            <FileArchive aria-hidden="true" />
          </div>
          <section className="settings-panel">
            <BusinessAssetField
              label="프레스킷 ZIP"
              hint="ZIP · 최대 100MB · 드래그하거나 파일을 선택하세요"
              accept=".zip,application/zip"
              icon={FileArchive}
              value={business.pressKitUrl}
              busy={saving}
              onUpload={(file) => void uploadBusinessAsset("pressKitUrl", file)}
            />
            <BusinessAssetField
              label="프로필 PDF"
              hint="PDF · 최대 100MB · 드래그하거나 파일을 선택하세요"
              accept=".pdf,application/pdf"
              icon={FileText}
              value={business.profilePdfUrl}
              busy={saving}
              onUpload={(file) =>
                void uploadBusinessAsset("profilePdfUrl", file)
              }
            />
          </section>
        </>
      )}

      {tab === "login-slides" && (
        <LoginSlidesField value={loginSlides} onChange={setLoginSlides} />
      )}

      <AvatarAssetManager
        active={tab === "avatars"}
        onDirtyChange={setAvatarDirty}
        onError={setError}
        onToast={showToast}
      />

      {tab === "admins" && isSuperAdmin && (
        <AdminAccountsPanel
          onError={setError}
          onSuccess={(message) => {
            setToast(message);
            window.setTimeout(() => setToast(""), 2600);
          }}
        />
      )}
    </div>
  );
}
