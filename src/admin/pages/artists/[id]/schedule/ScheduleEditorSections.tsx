import { type CSSProperties } from "react";
import FormField from "@/admin/components/content/FormField";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import CustomSelect from "@/core/components/form/CustomSelect";
import styles from "@/styles/(admin)/pages/artist-schedule/schedule-admin.module.css";
import {
  CATEGORY,
  type Category,
  type ScheduleDraft,
  type ScheduleTab,
} from "./schedule-editor-model";

interface ScheduleEditorSectionsProps {
  draft: ScheduleDraft;
  tab: ScheduleTab;
  language: AdminLanguage;
  fieldErrors: Record<string, string>;
  detailsRef: { current: HTMLDivElement | null };
  patch: (value: Partial<ScheduleDraft>) => void;
}

export default function ScheduleEditorSections({
  draft,
  tab,
  language,
  fieldErrors,
  detailsRef,
  patch,
}: ScheduleEditorSectionsProps) {
  return (
    <div className="content-editor-stack">
      {tab === "details" && (
        <div ref={detailsRef}>
          <div className="content-section-heading">
            <h3>일정 기본 정보</h3>
            <span>
              공개 캘린더에서 날짜순으로 표시할 일정의 핵심 정보입니다.
            </span>
          </div>
          <FormField
            label="일정명"
            activeLang={language}
            error={fieldErrors.titleKo}
            valueKo={draft.titleKo}
            valueEn={draft.titleEn}
            valueJa={draft.titleJa}
            onChangeKo={(titleKo) => patch({ titleKo })}
            onChangeEn={(titleEn) => patch({ titleEn })}
            onChangeJa={(titleJa) => patch({ titleJa })}
            required
          />
          <div className="music-field-grid two">
            <label className="music-field">
              <span>
                날짜 <b>*</b>
              </span>
              <input
                name="eventDate"
                type="date"
                className="admin-input"
                value={draft.eventDate}
                onChange={(event) => patch({ eventDate: event.target.value })}
                aria-invalid={Boolean(fieldErrors.eventDate)}
                aria-describedby={
                  fieldErrors.eventDate ? "schedule-date-error" : undefined
                }
              />
              {fieldErrors.eventDate && (
                <p
                  id="schedule-date-error"
                  className="admin-field-error"
                  role="alert"
                >
                  {fieldErrors.eventDate}
                </p>
              )}
            </label>
            <label className="music-field">
              <span>시작 시간</span>
              <input
                type="time"
                className="admin-input"
                value={draft.startTime}
                onChange={(event) => patch({ startTime: event.target.value })}
              />
            </label>
          </div>
          <div className="music-field-grid two">
            <div className="music-field">
              <span>
                일정 유형 <b>*</b>
              </span>
              <CustomSelect
                ariaLabel="일정 유형"
                value={draft.category}
                onChange={(category) =>
                  patch({ category: category as Category })
                }
                options={(Object.keys(CATEGORY) as Category[]).map((key) => ({
                  value: key,
                  label: CATEGORY[key].label,
                }))}
              />
            </div>
            <div className="music-field">
              <span>캘린더 표시</span>
              <div
                className={styles.categoryPreview}
                style={
                  {
                    "--category-color": CATEGORY[draft.category].color,
                  } as CSSProperties
                }
              >
                {(() => {
                  const CategoryIcon = CATEGORY[draft.category].icon;
                  return (
                    <i>
                      <CategoryIcon aria-hidden="true" />
                    </i>
                  );
                })()}
                {CATEGORY[draft.category].label}
              </div>
            </div>
          </div>
          <FormField
            label="장소"
            activeLang={language}
            valueKo={draft.location}
            valueEn={draft.locationEn}
            valueJa={draft.locationJa}
            onChangeKo={(location) => patch({ location })}
            onChangeEn={(locationEn) => patch({ locationEn })}
            onChangeJa={(locationJa) => patch({ locationJa })}
          />
          <label className="music-field content-field-short">
            <span>연결 링크</span>
            <input
              name="linkUrl"
              type="url"
              className="admin-input"
              value={draft.linkUrl}
              onChange={(event) => patch({ linkUrl: event.target.value })}
              placeholder="https://"
              aria-invalid={Boolean(fieldErrors.linkUrl)}
              aria-describedby={
                fieldErrors.linkUrl ? "schedule-link-error" : undefined
              }
            />
            {fieldErrors.linkUrl && (
              <p
                id="schedule-link-error"
                className="admin-field-error"
                role="alert"
              >
                {fieldErrors.linkUrl}
              </p>
            )}
          </label>
          <div className={styles.sectionDivider} />
          <div className="content-section-heading">
            <h3>일정 설명</h3>
            <span>
              언어 탭을 전환해 같은 폼에서 설명을 작성합니다. 번역이 없으면 공개
              페이지에서 한국어가 대신 표시됩니다.
            </span>
          </div>
          <FormField
            label="일정 설명"
            type="textarea"
            activeLang={language}
            valueKo={draft.descriptionKo}
            valueEn={draft.descriptionEn}
            valueJa={draft.descriptionJa}
            onChangeKo={(descriptionKo) => patch({ descriptionKo })}
            onChangeEn={(descriptionEn) => patch({ descriptionEn })}
            onChangeJa={(descriptionJa) => patch({ descriptionJa })}
          />
        </div>
      )}
      {tab === "publish" && (
        <>
          <div className="content-section-heading">
            <h3>공개 설정</h3>
            <span>
              저장 즉시 아티스트 공개 일정 페이지에 반영할지 선택합니다.
            </span>
          </div>
          <div className="content-publish-summary">
            <div>
              <span>일정</span>
              <strong>{draft.titleKo || "미입력"}</strong>
            </div>
            <div>
              <span>날짜 · 시간</span>
              <strong>
                {draft.eventDate || "미입력"}
                {draft.startTime ? ` · ${draft.startTime}` : ""}
              </strong>
            </div>
            <div>
              <span>유형</span>
              <strong>{CATEGORY[draft.category].label}</strong>
            </div>
            <div>
              <span>장소</span>
              <strong>{draft.location || "미설정"}</strong>
            </div>
          </div>
          <div className="content-choice-grid">
            <label className="content-choice">
              <input
                type="radio"
                checked={draft.isPublished}
                onChange={() => patch({ isPublished: true })}
              />
              <span>
                <b>바로 공개</b>
                <small>공개 일정 페이지와 달력에 표시합니다.</small>
              </span>
            </label>
            <label className="content-choice">
              <input
                type="radio"
                checked={!draft.isPublished}
                onChange={() => patch({ isPublished: false })}
              />
              <span>
                <b>비공개로 저장</b>
                <small>관리자만 확인할 수 있는 상태로 보관합니다.</small>
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
