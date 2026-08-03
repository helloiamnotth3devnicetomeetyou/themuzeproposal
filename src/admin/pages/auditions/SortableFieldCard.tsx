"use client";

import { useId, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, Calendar, CircleDot, FileText, GripVertical, Image, List, Music, Paperclip, Plus, Split, SquareCheck, Trash2, Video, X } from "lucide-react";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  FIELD_HAS_OPTIONS,
  FIELD_TYPE_BADGE,
  FIELD_TYPE_OPTIONS,
  type AuditionField,
  type AuditionFieldType,
} from "./audition-editor-model";

const FIELD_ICONS: Record<AuditionFieldType, React.ElementType> = {
  text: AlignLeft,
  textarea: FileText,
  select: List,
  radio: CircleDot,
  checkbox: SquareCheck,
  date: Calendar,
  file: Paperclip,
  page_break: Split,
};

export function SortableFieldCard({
  field,
  index,
  onChange,
  onRemove,
}: {
  field: AuditionField;
  index: number;
  total: number;
  onChange: (patch: Partial<AuditionField>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPageBreak = field.type === "page_break";
  const hasOptions = FIELD_HAS_OPTIONS[field.type];
  const [newOption, setNewOption] = useState("");
  const inputId = useId();
  const IconComponent = FIELD_ICONS[field.type] || AlignLeft;

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    onChange({ options: [...(field.options ?? []), trimmed] });
    setNewOption("");
  };

  const removeOption = (i: number) => {
    onChange({ options: (field.options ?? []).filter((_, idx) => idx !== i) });
  };

  if (isPageBreak) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`audition-field-card is-page-break ${isDragging ? "is-dragging" : ""}`}
      >
        <div className="audition-field-card-header">
          <button
            type="button"
            aria-label="드래그하여 순서 변경"
            className="audition-field-drag-handle"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" />
          </button>
          <span className="audition-field-type-badge is-page-break">
            <Split aria-hidden="true" /> 페이지 구분선
          </span>
          <div className="audition-field-type-wrap">
            <CustomSelect
              ariaLabel="필드 유형"
              value={field.type}
              onChange={(v) => onChange({ type: v as AuditionFieldType, options: [] })}
              options={FIELD_TYPE_OPTIONS}
            />
          </div>
          <div className="audition-field-card-actions">
            <button type="button" onClick={onRemove} className="audition-field-remove-btn" title="삭제">
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="audition-field-card-body">
          <div className="audition-field-row">
            <label htmlFor={`${inputId}-pageTitle`}>다음 페이지 제목 (선택)</label>
            <input
              id={`${inputId}-pageTitle`}
              className="admin-input"
              value={field.pageTitle ?? ""}
              onChange={(e) => onChange({ pageTitle: e.target.value })}
              placeholder="예: 2단계. 오디션 자료 첨부"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`audition-field-card type-${field.type} ${isDragging ? "is-dragging" : ""}`}
    >
      <div className="audition-field-card-header">
        <button
          type="button"
          aria-label="드래그하여 순서 변경"
          className="audition-field-drag-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </button>
        <span className={`audition-field-type-badge type-${field.type}`}>
          <IconComponent aria-hidden="true" />
          {FIELD_TYPE_BADGE[field.type]}
        </span>
        <span className="audition-field-index">{index + 1}</span>
        <div className="audition-field-type-wrap">
          <CustomSelect
            ariaLabel="필드 유형"
            value={field.type}
            onChange={(v) => onChange({ type: v as AuditionFieldType, options: [] })}
            options={FIELD_TYPE_OPTIONS}
          />
        </div>
        <div className="audition-field-card-actions">
          <button type="button" onClick={onRemove} className="audition-field-remove-btn" title="삭제">
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="audition-field-card-body">
        <div className="audition-field-row">
          <label htmlFor={`${inputId}-label`}>질문 제목</label>
          <input
            id={`${inputId}-label`}
            className="admin-input"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="질문 입력…"
          />
        </div>

        {(field.type === "text" || field.type === "textarea") && (
          <div className="audition-field-row">
            <label htmlFor={`${inputId}-placeholder`}>플레이스홀더</label>
            <input
              id={`${inputId}-placeholder`}
              className="admin-input"
              value={field.placeholder ?? ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              placeholder="입력 안내 텍스트 (선택)"
            />
          </div>
        )}

        {field.type === "file" && (() => {
          const currentAccept = field.accept ?? "image/*,application/pdf";
          const isImage = currentAccept.includes("image/*");
          const isPdf = currentAccept.includes("application/pdf");
          const isAudio = currentAccept.includes("audio/*");
          const isVideo = currentAccept.includes("video/*");

          const toggleAccept = (key: "image" | "pdf" | "audio" | "video") => {
            const presetMap = {
              image: "image/*",
              pdf: "application/pdf",
              audio: "audio/*",
              video: "video/*",
            };
            const currentParts = new Set(
              currentAccept.split(",").map((s) => s.trim()).filter(Boolean),
            );
            const targetMime = presetMap[key];
            if (currentParts.has(targetMime)) {
              currentParts.delete(targetMime);
            } else {
              currentParts.add(targetMime);
            }
            const newAccept = Array.from(currentParts).join(",");
            onChange({ accept: newAccept || "image/*,application/pdf" });
          };

          return (
            <div className="audition-field-row">
              <label>허용 파일 형식</label>
              <div className="audition-file-preset-chips">
                <label className={`audition-file-preset-chip ${isImage ? "is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isImage}
                    onChange={() => toggleAccept("image")}
                  />
                  <Image className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>이미지 (JPG, PNG 등)</span>
                </label>
                <label className={`audition-file-preset-chip ${isPdf ? "is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isPdf}
                    onChange={() => toggleAccept("pdf")}
                  />
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>PDF 문서</span>
                </label>
                <label className={`audition-file-preset-chip ${isAudio ? "is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isAudio}
                    onChange={() => toggleAccept("audio")}
                  />
                  <Music className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>음성/음원 (MP3, WAV 등)</span>
                </label>
                <label className={`audition-file-preset-chip ${isVideo ? "is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isVideo}
                    onChange={() => toggleAccept("video")}
                  />
                  <Video className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>동영상 (MP4 등)</span>
                </label>
              </div>
            </div>
          );
        })()}

        {hasOptions && (
          <div className="audition-field-options">
            <p className="audition-field-options-label">선택지 목록</p>
            <ul className="audition-field-options-preview-list">
              {(field.options ?? []).map((opt, i) => (
                <li key={i} className={`audition-field-option-item type-${field.type}`}>
                  <span className="audition-option-icon">
                    {field.type === "radio" && <span className="audition-option-radio-dot" />}
                    {field.type === "checkbox" && <SquareCheck className="w-3.5 h-3.5" />}
                    {field.type === "select" && <span className="audition-option-num">{i + 1}</span>}
                  </span>
                  <input
                    type="text"
                    className="admin-input audition-option-input"
                    value={opt}
                    onChange={(e) => {
                      const next = [...(field.options ?? [])];
                      next[i] = e.target.value;
                      onChange({ options: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="audition-field-remove-btn"
                    title="선택지 삭제"
                  >
                    <X aria-hidden="true" /><span className="sr-only">삭제</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="audition-field-option-add">
              <input
                className="admin-input"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                placeholder="새 선택지 입력 후 Enter"
              />
              <button type="button" onClick={addOption} className="admin-btn admin-btn-secondary">
                <Plus aria-hidden="true" />선택지 추가
              </button>
            </div>
          </div>
        )}

        <label className="audition-field-required-toggle">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          <span>필수 항목</span>
        </label>
      </div>
    </div>
  );
}
