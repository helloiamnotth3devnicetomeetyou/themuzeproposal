"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Calendar, Check, Layers, Plus, X } from "lucide-react";
import { supabase } from "@/core/supabase/client";
import { SortableFieldCard } from "./SortableFieldCard";
import AuditionSaveWarningDialog from "./AuditionSaveWarningDialog";
import {
  AUDITION_STATUS_OPTIONS,
  EMPTY_AUDITION_DRAFT,
  type AuditionDraft,
  type AuditionField,
  type AuditionSession,
} from "./audition-editor-model";

function nanoid(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("");
}

// ─── Form Builder ─────────────────────────────────────────────────────────────

function FormBuilder({
  schema,
  onChange,
}: {
  schema: AuditionField[];
  onChange: (schema: AuditionField[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addField = (type: AuditionField["type"] = "text") => {
    const newField: AuditionField = { id: nanoid(), type, label: "", required: false };
    onChange([...schema, newField]);
  };

  const updateField = (id: string, patch: Partial<AuditionField>) =>
    onChange(schema.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeField = (id: string) =>
    onChange(schema.filter((f) => f.id !== id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = schema.findIndex((f) => f.id === active.id);
    const newIndex = schema.findIndex((f) => f.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) onChange(arrayMove(schema, oldIndex, newIndex));
  };

  return (
    <div className="audition-form-builder">
      {schema.length === 0 && (
        <div className="audition-form-empty">
          <p>아직 추가된 항목이 없습니다. 아래 버튼으로 첫 항목을 추가하세요.</p>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={schema.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {schema.map((field, index) => (
            <SortableFieldCard
              key={field.id}
              field={field}
              index={index}
              total={schema.length}
              onChange={(patch) => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button type="button" onClick={() => addField()} className="audition-add-field-btn">
        <Plus aria-hidden="true" />질문 항목 추가
      </button>
    </div>
  );
}

// ─── SettingsTab ──────────────────────────────────────────────────────────────

export function SettingsTab({
  session,
  onRefresh,
}: {
  session: AuditionSession | null;
  onRefresh: () => void;
}) {
  const isNew = !session;

  const [draft, setDraft] = useState<AuditionDraft>(
    session
      ? {
          title: session.title,
          status: session.status,
          start_at: session.start_at ? session.start_at.slice(0, 16) : "",
          end_at: session.end_at ? session.end_at.slice(0, 16) : "",
          categories: [...session.categories],
          form_schema: [...session.form_schema],
          category_forms: { ...(session.category_forms ?? {}) },
        }
      : { ...EMPTY_AUDITION_DRAFT },
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  // "공통 폼" = "__default__", or a category name
  const [activeFormTab, setActiveFormTab] = useState("__default__");

  const categoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const patch = <K extends keyof AuditionDraft>(key: K, value: AuditionDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // ── Category management ─────────────────────────────────────────────────────
  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || draft.categories.includes(trimmed)) return;
    patch("categories", [...draft.categories, trimmed]);
    setNewCategory("");
    categoryInputRef.current?.focus();
  };

  const removeCategory = (cat: string) => {
    patch("categories", draft.categories.filter((c) => c !== cat));
    // Also clean up any category-specific form for that cat
    const next = { ...draft.category_forms };
    delete next[cat];
    patch("category_forms", next);
    if (activeFormTab === cat) setActiveFormTab("__default__");
  };

  // ── Per-form schema getters/setters ─────────────────────────────────────────
  const getSchema = useCallback(
    (tab: string) =>
      tab === "__default__" ? draft.form_schema : (draft.category_forms[tab] ?? []),
    [draft],
  );

  const setSchema = useCallback(
    (tab: string, schema: AuditionField[]) => {
      if (tab === "__default__") {
        patch("form_schema", schema);
      } else {
        patch("category_forms", { ...draft.category_forms, [tab]: schema });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft.category_forms],
  );

  // ── Save ────────────────────────────────────────────────────────────────────
  const executeSave = async () => {
    setSaving(true);
    setError("");
    setShowWarnDialog(false);
    try {
      const payload = {
        id: session?.id,
        title: draft.title.trim() || "오디션",
        status: draft.status,
        start_at: draft.start_at || null,
        end_at: draft.end_at || null,
        categories: draft.categories,
        form_schema: draft.form_schema,
        category_forms: draft.category_forms,
      };

      const res = await fetch("/api/admin/audition/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "저장에 실패했습니다.");
      }

      setToast("저장했습니다.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = async () => {
    // 진행 중인 오디션 세션이고, 기존 DB 세션이 존재할 때 제출된 지원서 개수 확인
    if (session?.id && (session.status === "open" || draft.status === "open")) {
      try {
        const { count, error: countErr } = await supabase
          .from("audition_submissions")
          .select("*", { count: "exact", head: true })
          .eq("audition_id", session.id);

        if (!countErr && typeof count === "number" && count > 0) {
          setSubmissionCount(count);
          setShowWarnDialog(true);
          return;
        }
      } catch {}
    }
    await executeSave();
  };

  // ── Active tab's schema ─────────────────────────────────────────────────────
  const activeSchema = getSchema(activeFormTab);

  const hasCategoryForms = draft.categories.length > 0;
  const categoryHasOwnForm = (cat: string) =>
    Array.isArray(draft.category_forms[cat]) && (draft.category_forms[cat]?.length ?? 0) > 0;

  return (
    <div className="audition-settings-tab">
      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <b>!</b><span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      )}
      {toast && (
        <div className="hero-admin-alert is-success" role="status">
          <Check aria-hidden="true" /><span>{toast}</span>
        </div>
      )}

      {/* ── 기본 설정 ── */}
      <section className="audition-settings-section">
        <div className="audition-section-heading"><h2>오디션 기본 설정</h2></div>

        <div className="audition-settings-grid">
          <div className="audition-settings-field">
            <label htmlFor="aud-title">오디션 제목</label>
            <input
              id="aud-title"
              className="admin-input"
              value={draft.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="예: 2026 하반기 오디션"
            />
          </div>

          <div className="audition-settings-field">
            <label>공개 상태</label>
            <div className="audition-status-selector">
              {AUDITION_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`audition-status-option ${draft.status === opt.value ? "is-active" : ""}`}
                  onClick={() => patch("status", opt.value)}
                >
                  <b>{opt.label}</b>
                  <small>{opt.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="audition-settings-field">
            <label htmlFor="aud-start">접수 시작일시</label>
            <div className="audition-date-field">
              <Calendar aria-hidden="true" />
              <input
                id="aud-start"
                type="datetime-local"
                className="admin-input"
                value={draft.start_at}
                onChange={(e) => patch("start_at", e.target.value)}
              />
            </div>
          </div>

          <div className="audition-settings-field">
            <label htmlFor="aud-end">접수 마감일시</label>
            <div className="audition-date-field">
              <Calendar aria-hidden="true" />
              <input
                id="aud-end"
                type="datetime-local"
                className="admin-input"
                value={draft.end_at}
                onChange={(e) => patch("end_at", e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 분과 ── */}
      <section className="audition-settings-section">
        <div className="audition-section-heading">
          <h2>지원 분과</h2>
          <p>지원자가 선택할 분과 목록입니다. 분과별로 다른 폼을 구성할 수 있습니다.</p>
        </div>
        <div className="audition-category-list">
          {draft.categories.map((cat) => (
            <span key={cat} className="audition-category-tag">
              {cat}
              <button type="button" onClick={() => removeCategory(cat)}>
                <X aria-hidden="true" /><span className="sr-only">{cat} 삭제</span>
              </button>
            </span>
          ))}
        </div>
        <div className="audition-category-add">
          <input
            ref={categoryInputRef}
            className="admin-input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
            placeholder="분과명 입력 후 Enter"
          />
          <button type="button" onClick={addCategory} className="admin-btn admin-btn-secondary">
            <Plus aria-hidden="true" />추가
          </button>
        </div>
      </section>

      {/* ── 폼 빌더 ── */}
      <section className="audition-settings-section">
        <div className="audition-section-heading">
          <h2>입력 폼 설정</h2>
          <p>
            {hasCategoryForms
              ? "분과별로 별도 폼을 구성하거나, 공통 폼을 기본으로 사용합니다. 드래그로 순서 변경이 가능합니다."
              : "지원서에 포함될 질문 항목을 구성합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다."}
          </p>
        </div>

        {/* ── Form tab selector ─── */}
        {hasCategoryForms && (
          <div className="audition-form-tabs">
            <button
              type="button"
              className={`audition-form-tab ${activeFormTab === "__default__" ? "is-active" : ""}`}
              onClick={() => setActiveFormTab("__default__")}
            >
              <Layers aria-hidden="true" />
              공통 폼
            </button>
            {draft.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`audition-form-tab ${activeFormTab === cat ? "is-active" : ""} ${categoryHasOwnForm(cat) ? "has-fields" : ""}`}
                onClick={() => setActiveFormTab(cat)}
              >
                {cat}
                {categoryHasOwnForm(cat) && <span className="audition-form-tab-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}

        {hasCategoryForms && activeFormTab !== "__default__" && (
          <p className="audition-form-tab-hint">
            이 분과의 폼 항목이 없으면 공통 폼이 사용됩니다.
          </p>
        )}

        <FormBuilder
          schema={activeSchema}
          onChange={(schema) => setSchema(activeFormTab, schema)}
        />
      </section>

      <div className="audition-settings-footer">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={saving}
          onClick={() => void handleSaveClick()}
        >
          {saving ? "저장 중…" : "설정 저장"}
        </button>
      </div>

      {showWarnDialog && (
        <AuditionSaveWarningDialog
          title="진행 중인 오디션 폼 변경 경고"
          submissionCount={submissionCount}
          confirmValue={draft.title}
          valueLabel="오디션 제목"
          busy={saving}
          onCancel={() => setShowWarnDialog(false)}
          onConfirm={() => void executeSave()}
        />
      )}
    </div>
  );
}
