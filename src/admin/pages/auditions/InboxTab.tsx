"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Inbox, Mail, Paperclip, Phone, Search, UserRound } from "lucide-react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import CustomSelect from "@/core/components/form/CustomSelect";
import { useAdminEntityEditor } from "@/admin/hooks/useAdminEntityEditor";
import { supabase } from "@/core/supabase/client";
import {
  SUBMISSION_STATUSES,
  submissionStatusClass,
  submissionStatusLabel,
  type AuditionField,
  type AuditionSubmission,
  type SubmissionStatus,
} from "./audition-editor-model";

const formatDate = (value: string, detail = false) =>
  new Intl.DateTimeFormat("ko-KR", detail
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" }
  ).format(new Date(value));

const formatBytes = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function SubmissionDetail({
  viewing,
  schema,
  saving,
  error,
  setError,
  onBack,
  onUpdateStatus,
}: {
  viewing: AuditionSubmission;
  schema: AuditionField[];
  saving: boolean;
  error: string;
  setError: (e: string) => void;
  onBack: () => void;
  onUpdateStatus: (id: string, status: SubmissionStatus) => void;
}) {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ?? "";
  const attachmentUrl = viewing.attachment_path
    ? `${storageUrl}/audition-attachments/${viewing.attachment_path}`
    : null;

  const renderAnswerValue = (field: AuditionField) => {
    const val = viewing.answers?.[field.id];
    if (!val) return "-";
    if (Array.isArray(val)) return val.join(", ") || "-";
    return String(val) || "-";
  };

  return (
    <div className="audition-admin-page audition-admin-detail">
      <button type="button" className="audition-back" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> 지원서 목록
      </button>
      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <b>!</b><span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      )}
      <section className="audition-detail-card">
        <header className="audition-detail-header">
          <span className="audition-detail-avatar"><UserRound aria-hidden="true" /></span>
          <div>
            <p>{viewing.category ?? "분과 미지정"}</p>
            <h2>{viewing.name ?? "이름 없음"}</h2>
            <small>{formatDate(viewing.created_at, true)} 접수</small>
          </div>
          <span className={`audition-status ${submissionStatusClass(viewing.status)}`}>
            <i />{submissionStatusLabel(viewing.status)}
          </span>
        </header>

        <div className="audition-contact-strip">
          <a href={viewing.email ? `mailto:${viewing.email}` : undefined} aria-disabled={!viewing.email}>
            <Mail aria-hidden="true" />
            <span><small>이메일</small><b>{viewing.email ?? "미입력"}</b></span>
          </a>
          <a href={viewing.contact ? `tel:${viewing.contact}` : undefined} aria-disabled={!viewing.contact}>
            <Phone aria-hidden="true" />
            <span><small>연락처</small><b>{viewing.contact ?? "미입력"}</b></span>
          </a>
        </div>

        <div className="audition-detail-body">
          {schema.length > 0 && (
            <section>
              <div className="audition-section-heading"><h3>지원서 답변</h3></div>
              <dl className="audition-answers-list">
                {schema.filter((f) => f.type !== "file").map((field) => (
                  <div key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{renderAnswerValue(field)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {schema.length === 0 && (
            <section>
              <div className="audition-section-heading"><h3>지원자 정보</h3></div>
              <dl className="audition-info-grid">
                <div><dt>지원 분야</dt><dd>{viewing.category ?? "-"}</dd></div>
                <div><dt>생년월일</dt><dd>{viewing.birth ?? "-"}</dd></div>
                <div><dt>성별</dt><dd>{viewing.gender ?? "-"}</dd></div>
                <div><dt>접수일</dt><dd>{formatDate(viewing.created_at)}</dd></div>
              </dl>
              {viewing.intro && (
                <section>
                  <div className="audition-section-heading"><h3>자기소개</h3></div>
                  <p className="audition-intro">{viewing.intro}</p>
                </section>
              )}
              {viewing.link && (
                <section>
                  <div className="audition-section-heading"><h3>오디션 자료</h3></div>
                  <a className="audition-media-link" href={viewing.link} target="_blank" rel="noreferrer">
                    <span><ExternalLink aria-hidden="true" /></span>
                    <div><b>첨부 링크 열기</b><small>{viewing.link}</small></div>
                    <em>새 창에서 보기 →</em>
                  </a>
                </section>
              )}
            </section>
          )}

          {attachmentUrl && (
            <section>
              <div className="audition-section-heading"><h3>첨부 파일</h3></div>
              <a className="audition-media-link" href={attachmentUrl} target="_blank" rel="noreferrer">
                <span><Paperclip aria-hidden="true" /></span>
                <div>
                  <b>{viewing.attachment_name ?? "첨부 파일"}</b>
                  <small>{formatBytes(viewing.attachment_size)} · 새 창에서 열기</small>
                </div>
                <em>열기 →</em>
              </a>
            </section>
          )}
        </div>

        <footer className="audition-status-bar">
          <div><span>STATUS</span><b>지원 상태 변경</b></div>
          <div>
            {SUBMISSION_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={saving}
                className={(viewing.status ?? "pending") === s.value ? "is-active" : ""}
                onClick={() => onUpdateStatus(viewing.id, s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}

export function InboxTab({ schema }: { schema: AuditionField[] }) {
  const [submissions, setSubmissions] = useState<AuditionSubmission[]>([]);
  const [viewing, setViewing] = useState<AuditionSubmission | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { loading, saving, error, setError, setToast, runLoad, runSave } =
    useAdminEntityEditor<AuditionSubmission>({ initialDraft: null });

  const fetchSubmissions = useCallback(async () => {
    await runLoad(async () => {
      const { data, error: fetchError } = await supabase
        .from("audition_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setSubmissions((data ?? []) as AuditionSubmission[]);
    });
  }, [runLoad]);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return submissions.filter((s) => {
      const matchesStatus = filter === "all" || (s.status ?? "pending") === filter;
      const matchesQuery = !keyword ||
        `${s.name ?? ""} ${s.email ?? ""} ${s.contact ?? ""} ${s.category ?? ""}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesQuery;
    });
  }, [filter, query, submissions]);

  const pendingCount = submissions.filter((s) => !s.status || s.status === "pending").length;
  const reviewingCount = submissions.filter((s) => s.status === "reviewing").length;

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    await runSave(async () => {
      const { error: updateError } = await supabase
        .from("audition_submissions")
        .update({ status })
        .eq("id", id);
      if (updateError) throw updateError;
      setSubmissions((curr) => curr.map((s) => s.id === id ? { ...s, status } : s));
      setViewing((curr) => curr?.id === id ? { ...curr, status } : curr);
      setToast("지원서 상태를 저장했습니다.");
    });
  };

  if (loading) return <LoadingIndicator label="지원서 목록을 불러오는 중…" className="min-h-[320px] bg-[var(--bg-card)]" />;

  if (viewing) {
    return (
      <SubmissionDetail
        viewing={viewing}
        schema={schema}
        saving={saving}
        error={error}
        setError={setError}
        onBack={() => setViewing(null)}
        onUpdateStatus={(id, status) => void updateStatus(id, status)}
      />
    );
  }

  return (
    <div className="audition-admin-page">
      {error && (
        <div className="hero-admin-alert is-error" role="alert">
          <b>!</b><span>{error}</span>
          <button type="button" onClick={() => setError("")}>닫기</button>
        </div>
      )}
      <section className="audition-inbox-summary">
        <div>
          <span className="audition-summary-icon"><Inbox aria-hidden="true" /></span>
          <p><small>전체 지원서</small><strong>{submissions.length}</strong></p>
        </div>
        <dl>
          <div><dt>새 지원서</dt><dd>{pendingCount}</dd></div>
          <div><dt>검토 중</dt><dd>{reviewingCount}</dd></div>
        </dl>
        <p>지원자 정보와 첨부 자료를 확인하고<br />검토 상태를 기록할 수 있습니다.</p>
      </section>

      <section className="audition-inbox-panel">
        <header className="audition-inbox-toolbar">
          <div><h2>지원서 보관함</h2><p>{filteredSubmissions.length}개의 지원서</p></div>
          <div className="audition-inbox-filters">
            <label className="audition-search">
              <Search aria-hidden="true" />
              <span className="sr-only">지원서 검색</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 이메일, 지원 분야 검색" />
            </label>
            <CustomSelect
              ariaLabel="지원 상태 필터"
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "모든 상태" }, ...SUBMISSION_STATUSES]}
            />
          </div>
        </header>

        <div className="audition-table-wrap">
          <table className="audition-table">
            <thead>
              <tr>
                <th>접수일</th><th>지원자</th><th>지원 분야</th><th>연락처</th><th>첨부</th><th>상태</th>
                <th><span className="sr-only">보기</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s) => (
                <tr
                  key={s.id}
                  tabIndex={0}
                  onClick={() => setViewing(s)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setViewing(s); }}
                >
                  <td data-label="접수일"><span className="audition-date">{formatDate(s.created_at)}</span></td>
                  <td data-label="지원자"><b>{s.name ?? "이름 없음"}</b><small>{s.email ?? "이메일 미입력"}</small></td>
                  <td data-label="지원 분야">{s.category ?? "-"}</td>
                  <td data-label="연락처">{s.contact ?? "-"}</td>
                  <td data-label="첨부">
                    {s.attachment_name
                      ? <span className="audition-has-attachment"><Paperclip aria-hidden="true" />{s.attachment_name}</span>
                      : <span className="audition-no-attachment">-</span>}
                  </td>
                  <td data-label="상태">
                    <span className={`audition-status ${submissionStatusClass(s.status)}`}>
                      <i />{submissionStatusLabel(s.status)}
                    </span>
                  </td>
                  <td>
                    <button type="button" tabIndex={-1}>열기 <span><ArrowRight aria-hidden="true" /></span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredSubmissions.length && (
            <div className="hero-admin-empty">
              <Inbox aria-hidden="true" />
              <b>{submissions.length ? "조건에 맞는 지원서가 없습니다." : "아직 접수된 지원서가 없습니다."}</b>
              <span>{submissions.length ? "검색어나 상태 필터를 바꿔 보세요." : "새 지원서가 접수되면 이곳에 표시됩니다."}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
