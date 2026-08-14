"use client";

import { FileText } from "lucide-react";
import type { RefObject } from "react";
import FormField from "@/admin/components/content/FormField";
import NoticeCategoryInput from "@/admin/components/content/NoticeCategoryInput";
import { hasRichTextContent, sanitizeRichText } from "@/core/utils/rich-text";
import type { NoticeDraft } from "./notice-editor-model";
import type {
  NoticeLanguage,
  NoticeTab,
} from "./notice-manager-types";

type NoticeManagerEditorProps = {
  draft: NoticeDraft | null;
  scopeArtistId?: string;
  scopeName: string;
  tab: NoticeTab;
  language: NoticeLanguage;
  fieldErrors: Record<string, string>;
  categoryOptions: string[];
  editorRef: RefObject<HTMLDivElement | null>;
  onPatch: (patch: Partial<NoticeDraft>) => void;
  onAdd: () => void;
};

export default function NoticeManagerEditor({
  draft,
  scopeArtistId,
  scopeName,
  tab,
  language,
  fieldErrors,
  categoryOptions,
  editorRef,
  onPatch,
  onAdd,
}: NoticeManagerEditorProps) {
  if (!draft) {
    return (
      <div className="content-no-selection">
        <span>
          <FileText aria-hidden="true" />
        </span>
        <h2>공지를 선택하세요</h2>
        <p>왼쪽 라이브러리에서 공지를 열거나 새 소식을 작성할 수 있습니다.</p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={onAdd}
        >
          공지 작성
        </button>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="content-editor-stack">
      {tab === "content" && (
        <>
          <div className="content-section-heading">
            <h3>공지 내용</h3>
            <span>
              독자가 목록에서 찾고 본문에서 읽게 될 제목과 내용을 작성합니다.
            </span>
          </div>
          <label
            data-validation-field="date"
            className="music-field content-field-short"
          >
            <span>
              등록일 <b>*</b>
            </span>
            <input
              type="date"
              className="admin-input"
              value={draft.date}
              onChange={(event) => onPatch({ date: event.target.value })}
              aria-invalid={Boolean(fieldErrors.date)}
              aria-describedby={
                fieldErrors.date ? "notice-date-error" : undefined
              }
            />
            {fieldErrors.date && (
              <p
                id="notice-date-error"
                className="admin-field-error"
                role="alert"
              >
                {fieldErrors.date}
              </p>
            )}
          </label>
          <div
            data-validation-field="categoryKo"
            className="desk-translatable-field"
          >
            <div className="desk-translatable-heading">
              <label>
                분류{language === "ko" && <span>*</span>}
              </label>
            </div>
            <div className="desk-translatable-control">
              {language === "ko" ? (
                <NoticeCategoryInput
                  value={draft.categoryKo}
                  options={categoryOptions}
                  onChange={(categoryKo) => onPatch({ categoryKo })}
                />
              ) : (
                <input
                  className="admin-input w-full"
                  value={language === "en" ? draft.categoryEn : draft.categoryJa}
                  onChange={(event) =>
                    onPatch(
                      language === "en"
                        ? { categoryEn: event.target.value }
                        : { categoryJa: event.target.value },
                    )
                  }
                />
              )}
            </div>
            {fieldErrors.categoryKo && (
              <p className="admin-field-error" role="alert">
                {fieldErrors.categoryKo}
              </p>
            )}
          </div>
          <div data-validation-field="titleKo">
            <FormField
              label="제목"
              activeLang={language}
              error={fieldErrors.titleKo}
              valueKo={draft.titleKo}
              valueEn={draft.titleEn}
              valueJa={draft.titleJa}
              onChangeKo={(titleKo) => onPatch({ titleKo })}
              onChangeEn={(titleEn) => onPatch({ titleEn })}
              onChangeJa={(titleJa) => onPatch({ titleJa })}
              required
            />
          </div>
          <div data-validation-field="contentKo">
            <FormField
              label="본문"
              type="richtext"
              activeLang={language}
              error={fieldErrors.contentKo}
              valueKo={draft.contentKo}
              valueEn={draft.contentEn}
              valueJa={draft.contentJa}
              onChangeKo={(contentKo) => onPatch({ contentKo })}
              onChangeEn={(contentEn) => onPatch({ contentEn })}
              onChangeJa={(contentJa) => onPatch({ contentJa })}
              required
            />
          </div>
        </>
      )}
      {tab === "publish" && (
        <>
          <div className="content-section-heading">
            <h3>발행 설정</h3>
            <span>공지의 노출 범위와 공개 상태를 마지막으로 확인합니다.</span>
          </div>
          <div className="notice-preview-card">
            <p>{draft.categoryKo || "분류"}</p>
            <h3>{draft.titleKo || "공지 제목"}</h3>
            <small>
              {draft.date || "등록일 미설정"} · {" "}
              {scopeArtistId ? `${scopeName} 아티스트` : "전체 공지"}
            </small>
            {hasRichTextContent(draft.contentKo) ? (
              <div
                className="notice-preview-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(draft.contentKo),
                }}
              />
            ) : (
              <div className="notice-preview-content is-empty">
                공지 내용을 입력하면 여기에 미리 표시됩니다.
              </div>
            )}
          </div>
          <div className="content-choice-grid">
            <label className="content-choice">
              <input
                type="radio"
                checked={draft.published}
                onChange={() => onPatch({ published: true })}
              />
              <span>
                <b>공개</b>
                <small>저장 즉시 사이트 공지 목록에 표시합니다.</small>
              </span>
            </label>
            <label className="content-choice">
              <input
                type="radio"
                checked={!draft.published}
                onChange={() => onPatch({ published: false })}
              />
              <span>
                <b>비공개</b>
                <small>
                  관리자에만 저장하고 사이트에는 표시하지 않습니다.
                </small>
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
