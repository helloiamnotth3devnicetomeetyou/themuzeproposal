"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import styles from "@/styles/(admin)/pages/retention/retention-admin.module.css";

type RetentionKind = "contact_inquiry" | "protect_report";

type RetentionCandidate = {
  id: string;
  kind: RetentionKind;
  createdAt: string;
  expiresAt: string;
  attachmentCount: number;
  retryable: boolean;
  deletedAt: string | null;
};

type ApiRetentionCandidate = {
  kind: RetentionKind;
  id: string;
  created_at: string;
  expires_at: string;
  attachment_count: number;
  retryable: boolean;
  deleted_at?: string | null;
};

type RetentionPayload = {
  candidates: RetentionCandidate[];
  policyDays: number;
};

const POLICY_DAYS = 30;

function parsePayload(value: unknown): RetentionPayload {
  if (!value || typeof value !== "object") throw new Error("보존 정책 응답이 올바르지 않습니다.");
  const root = value as {
    policy?: { days?: unknown; basis?: unknown };
    candidates?: unknown;
  };
  if (
    !root.policy ||
    root.policy.basis !== "deleted_at" ||
    !Number.isSafeInteger(root.policy.days) ||
    Number(root.policy.days) < 1 ||
    !Array.isArray(root.candidates)
  ) {
    throw new Error("보존 정책 응답이 올바르지 않습니다.");
  }
  const candidates = root.candidates.filter(
    (candidate): candidate is ApiRetentionCandidate => {
      if (!candidate || typeof candidate !== "object") return false;
      const item = candidate as Record<string, unknown>;
      return (
        (item.kind === "contact_inquiry" || item.kind === "protect_report") &&
        typeof item.id === "string" &&
        typeof item.created_at === "string" &&
        typeof item.expires_at === "string" &&
        Number.isSafeInteger(item.attachment_count) &&
        Number(item.attachment_count) >= 0 &&
        typeof item.retryable === "boolean"
      );
    },
  ).map((candidate) => ({
    id: candidate.id,
    kind: candidate.kind,
    createdAt: candidate.created_at,
    expiresAt: candidate.expires_at,
    attachmentCount: candidate.attachment_count,
    retryable: candidate.retryable,
    deletedAt:
      typeof candidate.deleted_at === "string" ? candidate.deleted_at : null,
  })).sort((left, right) => {
    const leftDeleted = left.deletedAt ? Date.parse(left.deletedAt) : NaN;
    const rightDeleted = right.deletedAt ? Date.parse(right.deletedAt) : NaN;
    if (Number.isFinite(leftDeleted) || Number.isFinite(rightDeleted)) {
      if (!Number.isFinite(leftDeleted)) return 1;
      if (!Number.isFinite(rightDeleted)) return -1;
      return rightDeleted - leftDeleted;
    }
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    if (!Number.isFinite(leftTime)) return Number.isFinite(rightTime) ? 1 : 0;
    if (!Number.isFinite(rightTime)) return -1;
    return leftTime - rightTime;
  });
  return {
    candidates,
    policyDays: Number(root.policy.days),
  };
}

function errorMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const code = (value as { code?: unknown }).code;
  if (typeof code !== "string") return fallback;
  const messages: Record<string, string> = {
    FORBIDDEN: "관리자 권한이 필요합니다.",
    UNAUTHORIZED: "로그인이 필요합니다.",
    INVALID_REQUEST: "요청을 확인해 주세요.",
    SERVICE_UNAVAILABLE: "보존 대기열을 잠시 사용할 수 없습니다.",
    DELETE_FAILED: "파일 삭제에 실패했습니다. 재시도 대기 항목으로 남겼습니다.",
    RETRY_REQUIRED: "일부 항목이 재시도 대기 상태로 남았습니다.",
  };
  return messages[code] || fallback;
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function daysOld(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "보존 기준 확인 필요";
  return `${Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))}일 경과`;
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function candidateKey(candidate: Pick<RetentionCandidate, "kind" | "id">) {
  return `${candidate.kind}:${candidate.id}`;
}

function typeLabel(kind: RetentionKind) {
  return kind === "protect_report" ? "제보" : "문의";
}

function Icon({ name }: { name: "archive" | "refresh" | "trash" | "chevron" | "lock" }) {
  if (name === "refresh") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 10m0 0V5m0 5h5M4 13a8.1 8.1 0 0 0 14.8 3L21 14m0 0v5m0-5h-5" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 13h8l1-13" />
      </svg>
    );
  }
  if (name === "chevron") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 5 7 7-7 7" />
      </svg>
    );
  }
  if (name === "lock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export default function RetentionAdminPage() {
  const confirm = useAdminConfirm();
  const [payload, setPayload] = useState<RetentionPayload | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const allCandidatesRef = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/retention", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessage(body, "보존 대기열을 불러오지 못했습니다."));
      setPayload(parsePayload(body));
      setSelected(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "보존 대기열을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const candidates = useMemo(() => payload?.candidates ?? [], [payload]);
  const selectedCount = selected.size;
  const allSelected = candidates.length > 0 && selectedCount === candidates.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const policyDays = payload?.policyDays || POLICY_DAYS;
  const cutoff = new Date(now - policyDays * 86_400_000).toISOString();
  const restorableCount = candidates.filter(
    (candidate) => candidate.deletedAt && selected.has(candidateKey(candidate)),
  ).length;
  const candidateSummary = useMemo(() => {
    const contacts = candidates.filter((candidate) => candidate.kind === "contact_inquiry").length;
    const protects = candidates.length - contacts;
    return { contacts, protects };
  }, [candidates]);

  useEffect(() => {
    if (allCandidatesRef.current) allCandidatesRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleCandidate = (candidate: RetentionCandidate) => {
    const key = candidateKey(candidate);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setNotice("");
  };

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(candidates.map((candidate) => candidateKey(candidate))),
    );
    setNotice("");
  };

  const selectedCandidates = () =>
    candidates.filter((candidate) => selected.has(candidateKey(candidate)));

  const restoreSelected = async () => {
    const items = selectedCandidates().filter((candidate) => candidate.deletedAt);
    if (!items.length || deleting) return;
    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          items: items.map(({ kind, id }) => ({ kind, id })),
        }),
      });
      const body = await response.json().catch(() => null);
      const restored = (body as { deleted_count?: unknown } | null)?.deleted_count;
      if (typeof restored !== "number")
        throw new Error(errorMessage(body, "선택한 항목을 되돌리지 못했습니다."));
      setNotice(`${restored}건을 메일함으로 되돌렸습니다.`);
      await load(true);
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "선택한 항목을 되돌리지 못했습니다.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedCount || deleting) return;
    const confirmed = await confirm({
      title: `${selectedCount}건을 영구 삭제할까요?`,
      description:
        "선택한 문의·제보와 연결 파일이 즉시 영구 삭제됩니다. 삭제 후에는 복구할 수 없습니다.",
      confirmLabel: "영구 삭제",
      cancelLabel: "취소",
      tone: "danger",
    });
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/retention", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: candidates
            .filter((candidate) => selected.has(candidateKey(candidate)))
            .map(({ kind, id }) => ({ kind, id })),
        }),
      });
      const body = await response.json().catch(() => null);
      const result = body as { deleted_count?: unknown; failed_count?: unknown } | null;
      const hasPurgeResult =
        typeof result?.deleted_count === "number" && typeof result?.failed_count === "number";
      if (!response.ok && !hasPurgeResult) {
        throw new Error(errorMessage(body, "선택한 항목을 삭제하지 못했습니다."));
      }
      const deletedCount =
        typeof result?.deleted_count === "number" ? result.deleted_count : 0;
      const failedCount =
        typeof result?.failed_count === "number" ? result.failed_count : 0;
      setNotice(
        failedCount
          ? `${deletedCount}건 삭제, ${failedCount}건은 재시도 대기로 남겼습니다.`
          : `${deletedCount}건을 삭제했습니다. 감사 로그에는 식별자와 처리 결과만 기록됩니다.`,
      );
      await load(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "선택한 항목을 삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>보존 대기열 · 휴지통</h1>
          <p className={styles.lede}>
            휴지통으로 옮긴 문의·제보는 삭제일 기준 30일 후 자동 삭제됩니다. 여기서 되돌리거나 즉시 영구 삭제할 수 있습니다.
          </p>
        </div>
      </header>

      <section className={styles.horizon} aria-labelledby="retention-horizon-title">
        <div className={styles.horizonLabel}>
          <span id="retention-horizon-title">RETENTION HORIZON</span>
          <strong>{formatDate(cutoff)}</strong>
        </div>
        <div className={styles.horizonTrack} aria-hidden="true">
          <i />
          <i />
          <i />
          <b>30D</b>
        </div>
        <p>오늘 기준 {formatDate(cutoff)} 이전에 휴지통으로 옮긴 항목이 삭제 대상입니다.</p>
      </section>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>
            다시 시도
          </button>
        </div>
      )}
      {notice && (
        <div className={styles.notice} role="status" aria-live="polite">
          {notice}
        </div>
      )}

      <div className={styles.layout}>
        <aside className={styles.ruleCard} aria-labelledby="retention-rule-title">
          <div className={styles.ruleMarker} aria-hidden="true">30</div>
          <h2 id="retention-rule-title">삭제일 + 30일</h2>
          <p className={styles.ruleCopy}>
            휴지통으로 옮긴 항목만 대상이며, 옮긴 시점을 기준으로 보존 기간을 계산합니다. 휴지통에 넣지 않은 항목은 자동 삭제되지 않습니다.
          </p>
          <dl className={styles.ruleFacts}>
            <div>
              <dt>문의</dt>
              <dd>{candidateSummary.contacts}</dd>
            </div>
            <div>
              <dt>제보</dt>
              <dd>{candidateSummary.protects}</dd>
            </div>
          </dl>
          <p className={styles.ruleNote}>
            <Icon name="lock" /> 본문과 증거 내용은 감사 로그에 복사되지 않습니다.
          </p>
        </aside>

        <section className={styles.queue} aria-labelledby="retention-queue-title">
          <div className={styles.queueHeader}>
            <div>
              <h2 id="retention-queue-title">삭제 후보</h2>
              <p>{payload ? `${payload.candidates.length}건 · 삭제일 기준 최신 순` : "대기열을 확인하는 중"}</p>
            </div>
            <button
              className={styles.refresh}
              type="button"
              onClick={() => void load(true)}
              disabled={loading || refreshing || deleting}
              aria-label="삭제 후보 새로고침"
            >
              <Icon name="refresh" />
              <span>{refreshing ? "확인 중" : "새로고침"}</span>
            </button>
          </div>

          <div className={styles.queueToolbar}>
            <label className={styles.selectAll}>
              <input
                ref={allCandidatesRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={loading || !candidates.length || deleting}
                aria-label="삭제 후보 전체 선택"
              />
              <span>전체 선택</span>
            </label>
            <span className={styles.selectionMeta} aria-live="polite">
              {selectedCount ? `${selectedCount}건 선택됨` : "선택된 항목 없음"}
            </span>
            <button
              className={styles.refresh}
              type="button"
              onClick={() => void restoreSelected()}
              disabled={!restorableCount || deleting}
            >
              <Icon name="refresh" />
              <span>
                {restorableCount ? `${restorableCount}건 되돌리기` : "되돌리기"}
              </span>
            </button>
            <button
              className={styles.deleteButton}
              type="button"
              onClick={() => void deleteSelected()}
              disabled={!selectedCount || deleting}
            >
              <Icon name="trash" />
              <span>{deleting ? "삭제 중…" : "선택 항목 영구 삭제"}</span>
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingList} aria-label="삭제 후보 불러오는 중" aria-busy="true">
              {[1, 2, 3, 4].map((item) => <div className={styles.skeletonRow} key={item} />)}
            </div>
          ) : candidates.length ? (
            <div className={styles.candidateList} role="list" aria-label="삭제 후보 목록">
              {candidates.map((candidate) => (
                <label
                  className={`${styles.candidate} ${selected.has(candidateKey(candidate)) ? styles.selected : ""}`}
                  key={candidateKey(candidate)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(candidateKey(candidate))}
                    onChange={() => toggleCandidate(candidate)}
                    disabled={deleting}
                    aria-label={`${typeLabel(candidate.kind)} ${shortId(candidate.id)} 선택`}
                  />
                  <span className={styles.candidateType} data-kind={candidate.kind}>
                    {typeLabel(candidate.kind)}
                  </span>
                  <span className={styles.candidateIdentity}>
                    <strong>{shortId(candidate.id)}</strong>
                    <small>
                      {candidate.retryable
                        ? "재시도 대기"
                        : candidate.deletedAt
                          ? `휴지통 · ${formatDate(candidate.deletedAt)}`
                          : "보존 만료"}
                    </small>
                  </span>
                  <span className={styles.candidateDate}>
                    <strong>{formatDate(candidate.deletedAt ?? candidate.createdAt, true)}</strong>
                    <small>{daysOld(candidate.deletedAt ?? candidate.createdAt)} · 만료 {formatDate(candidate.expiresAt)}</small>
                  </span>
                  <span className={styles.candidateObjects}>
                    <strong>{candidate.attachmentCount}</strong>
                    <small>연결 파일</small>
                  </span>
                  <Icon name="chevron" />
                </label>
              ))}
            </div>
          ) : (
            <div className={styles.empty} role="status">
              <Icon name="archive" />
              <strong>지금 정리할 항목이 없습니다.</strong>
              <span>휴지통으로 옮긴 문의·제보가 여기에 표시됩니다.</span>
            </div>
          )}

          <footer className={styles.queueFooter}>
            <span>삭제 전 대상을 확인하고, 필요한 경우 목록을 새로고침하세요.</span>
            <span>R2 파일 · 본문 · 메타데이터</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
