"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  LuArrowRight,
  LuCheck,
  LuCircleAlert,
  LuFileCheck2,
  LuLockKeyhole,
  LuTrash2,
  LuUpload,
} from "react-icons/lu";
import CustomSelect from "@/components/ui/CustomSelect";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import styles from "./protect.module.css";

export type Artist = { id: string; name: string };
type ProtectTab = "mine" | "report";
export type MyReport = {
  id: string;
  artist_id: string;
  report_type: string;
  title: string;
  platform: string;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  created_at: string;
};
type ReportForm = {
  artistId: string;
  reportType: string;
  title: string;
  content: string;
  platform: string;
  postUrl: string;
  postedAt: string;
  authorName: string;
  postIp: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const HOLD_DURATION_MS = 1500;
const ACCEPTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const reportTypes = [
  { value: "defamation", label: "명예훼손·허위사실" },
  { value: "harassment", label: "악성 댓글·비방" },
  { value: "impersonation", label: "사칭·계정 도용" },
  { value: "copyright", label: "저작권·콘텐츠 침해" },
  { value: "privacy", label: "개인정보 노출" },
  { value: "other", label: "기타" },
];

const platforms = ["Instagram", "X (Twitter)", "YouTube", "TikTok", "Facebook", "커뮤니티·게시판", "기타"];

const statusLabels: Record<MyReport["status"], string> = {
  pending: "접수",
  reviewing: "검토 중",
  resolved: "처리 완료",
  rejected: "종결",
};

const initialForm: ReportForm = {
  artistId: "",
  reportType: "",
  title: "",
  content: "",
  platform: "",
  postUrl: "",
  postedAt: "",
  authorName: "",
  postIp: "",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ProtectClient({ initialUserEmail, initialArtists, initialReports, initialLoadFailed = false }: { initialUserEmail: string; initialArtists: Artist[]; initialReports: MyReport[]; initialLoadFailed?: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProtectTab>("mine");
  const userEmail = initialUserEmail;
  const artists = initialArtists;
  const [myReports, setMyReports] = useState<MyReport[]>(initialReports);
  const [form, setForm] = useState<ReportForm>(initialForm);
  const [fileSlots, setFileSlots] = useState<Array<File | null>>([null, null, null]);
  const [confirmed, setConfirmed] = useState(false);
  const [holdingSubmit, setHoldingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState(initialLoadFailed ? "신고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : "");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const files = useMemo(() => fileSlots.filter((file): file is File => file !== null), [fileSlots]);

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  const validateReport = () => {
    const requiredFields = [
      { label: "아티스트", id: "artist", missing: !form.artistId },
      { label: "신고 유형", id: "reportType", missing: !form.reportType },
      { label: "제목", id: "title", missing: !form.title.trim() },
      { label: "신고 내용", id: "content", missing: !form.content.trim() },
      { label: "게시 플랫폼", id: "platform", missing: !form.platform },
      { label: "게시물 URL", id: "postUrl", missing: !form.postUrl.trim() },
      { label: "게시 일자", id: "postedAt", missing: !form.postedAt },
      { label: "게시물 작성자", id: "authorName", missing: !form.authorName.trim() },
      { label: "첨부 자료", id: "evidenceFiles", missing: files.length === 0 },
      { label: "사실 확인 동의", id: "reportConfirmation", missing: !confirmed },
    ].filter((field) => field.missing);

    const labels = requiredFields.map((field) => field.label);
    setMissingFields(labels);
    if (!requiredFields.length) return true;

    setError(`입력하지 않은 항목이 ${requiredFields.length}개 있습니다.`);
    requestAnimationFrame(() => {
      const firstField = document.getElementById(requiredFields[0].id);
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = firstField?.matches("button, input, textarea, select")
        ? firstField
        : firstField?.querySelector<HTMLElement>("button, input, textarea, select");
      (focusTarget as HTMLElement | null)?.focus({ preventScroll: true });
    });
    return false;
  };

  const cancelSubmitHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldingSubmit(false);
  };

  const startSubmitHold = () => {
    if (submitting || holdTimer.current) return;
    if (!validateReport()) return;
    setHoldingSubmit(true);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setHoldingSubmit(false);
      formRef.current?.requestSubmit();
    }, HOLD_DURATION_MS);
  };

  const updateField =
    (field: keyof ReportForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      if (error) setError("");
      if (missingFields.length) setMissingFields([]);
    };

  const updateSelect = (field: keyof ReportForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError("");
    if (missingFields.length) setMissingFields([]);
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    setMissingFields([]);
    if (!incoming.length) return;

    if (files.length + incoming.length > 3) {
      setError("첨부 자료는 최대 3개까지 등록할 수 있습니다.");
      return;
    }

    const invalidType = incoming.find((file) => !ACCEPTED_FILE_TYPES.has(file.type));
    if (invalidType) {
      setError(`${invalidType.name}: JPG, PNG, WEBP, GIF 또는 PDF 파일만 첨부할 수 있습니다.`);
      return;
    }

    const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`${oversized.name}: 파일 크기는 50MB 이하여야 합니다.`);
      return;
    }

    const fileKeys = new Set(files.map((file) => `${file.name}:${file.size}`));
    const duplicate = incoming.find((file) => {
      const key = `${file.name}:${file.size}`;
      if (fileKeys.has(key)) return true;
      fileKeys.add(key);
      return false;
    });
    if (duplicate) {
      setError(`${duplicate.name}: 이미 첨부한 파일입니다.`);
      return;
    }

    setFileSlots((current) => {
      const next = [...current];
      incoming.forEach((file) => {
        const emptySlot = next.findIndex((item) => item === null);
        if (emptySlot >= 0) next[emptySlot] = file;
      });
      return next;
    });
  };

  const removeFile = (slot: number) => {
    setFileSlots((current) => current.map((item, index) => (index === slot ? null : item)));
    setError("");
    setMissingFields([]);
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!files.length) {
      setError("침해 내용을 확인할 수 있는 증거 자료를 1개 이상 첨부해 주세요.");
      return;
    }
    if (!confirmed) {
      setError("제보 내용이 사실에 근거해 작성되었음을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    const user = await getUser();
    if (!user) {
      router.replace("/login?redirect=/protect");
      return;
    }

    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "file";
        const path = `${user.id}/${crypto.randomUUID()}.${extension.toLowerCase()}`;
        const { error: uploadError } = await supabase.storage.from("protect-evidence").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const { data, error: insertError } = await supabase
        .from("protect_reports")
        .insert({
          user_id: user.id,
          reporter_email: user.email || null,
          artist_id: form.artistId,
          report_type: form.reportType,
          title: form.title.trim(),
          content: form.content.trim(),
          platform: form.platform,
          post_url: form.postUrl.trim(),
          posted_at: form.postedAt,
          author_name: form.authorName.trim(),
          post_ip: form.postIp.trim() || null,
          attachment_paths: uploadedPaths,
          attachment_names: files.map((file) => file.name),
          confirmation: true,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      setMyReports((current) => [
        {
          id: data.id,
          artist_id: form.artistId,
          report_type: form.reportType,
          title: form.title.trim(),
          platform: form.platform,
          status: "pending",
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);
      setSubmittedId(data.id);
      setForm(initialForm);
      setFileSlots([null, null, null]);
      setConfirmed(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      if (uploadedPaths.length) {
        await supabase.storage.from("protect-evidence").remove(uploadedPaths);
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <main className={styles.page}>
        <section className={styles.success} aria-labelledby="success-title">
          <LuFileCheck2 aria-hidden="true" />
          <p>REPORT RECEIVED</p>
          <h1 id="success-title">신고가 접수되었습니다.</h1>
          <span>제출 자료를 확인한 뒤 필요한 조치를 검토합니다.</span>
          <dl>
            <div><dt>접수 번호</dt><dd>{submittedId.slice(0, 8).toUpperCase()}</dd></div>
            <div><dt>처리 상태</dt><dd>접수 완료</dd></div>
          </dl>
          <button type="button" onClick={() => { setSubmittedId(""); setActiveTab("mine"); }}>내 신고 보기 <LuArrowRight aria-hidden="true" /></button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerSticky}>
            <h1>PROTECT</h1>
            <p>아티스트 권익 보호를 위한 신고 및 접수 내역을 확인하세요.</p>
            <nav className={styles.tabs} aria-label="권익 보호 메뉴">
              <button type="button" className={activeTab === "mine" ? styles.activeTab : ""} onClick={() => { setActiveTab("mine"); setError(""); }}>내 신고</button>
              <button type="button" className={activeTab === "report" ? styles.activeTab : ""} onClick={() => { setActiveTab("report"); setError(""); }}>신고하기</button>
            </nav>
            <div><LuLockKeyhole aria-hidden="true" /><span>비공개 접수</span><b>{userEmail}</b></div>
          </div>
        </header>

        <div className={styles.contentColumn}>
        {error && (
          <div className={styles.error} role="alert">
            <LuCircleAlert aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="오류 메시지 닫기">닫기</button>
          </div>
        )}

        {activeTab === "mine" && (
          <section className={styles.myReports} aria-labelledby="my-reports-title">
            <div className={styles.listHeading}>
              <div><h2 id="my-reports-title">내 신고</h2><p>접수한 신고와 현재 처리 상태를 확인할 수 있습니다.</p></div>
              <span>총 {myReports.length}건</span>
            </div>

            {myReports.length === 0 ? (
              <div className={styles.emptyState}>
                <p>아직 접수한 신고가 없습니다.</p>
                <span>권익 침해 사례를 발견했다면 내용을 알려주세요.</span>
                <button type="button" onClick={() => setActiveTab("report")}>신고하기 <LuArrowRight aria-hidden="true" /></button>
              </div>
            ) : (
              <div className={styles.reportList}>
                {myReports.map((report) => (
                  <article key={report.id} className={styles.reportItem}>
                    <div className={styles.reportMain}>
                      <span>{artists.find((artist) => artist.id === report.artist_id)?.name || "아티스트"} · {reportTypes.find((type) => type.value === report.report_type)?.label || "기타"}</span>
                      <h3>{report.title}</h3>
                      <p>{report.platform} · 접수번호 {report.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className={styles.reportStatus}>
                      <span data-status={report.status}>{statusLabels[report.status]}</span>
                      <time dateTime={report.created_at}>{new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(report.created_at))}</time>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "report" && <form ref={formRef} className={styles.form} onSubmit={submitReport}>
          <div className={styles.formRow}>
            <span className={styles.rowLabel}>아티스트 <i>*</i></span>
            <div id="artist" className={styles.selectControl}>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel="아티스트"
                value={form.artistId}
                onChange={updateSelect("artistId")}
                placeholder="아티스트를 선택해 주세요"
                options={artists.map((artist) => ({ value: artist.id, label: artist.name }))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.rowLabel}>신고 유형 <i>*</i></span>
            <div id="reportType" className={styles.selectControl}>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel="신고 유형"
                value={form.reportType}
                onChange={updateSelect("reportType")}
                placeholder="신고 유형을 선택해 주세요"
                options={reportTypes.map((type) => ({ value: type.value, label: type.label }))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label htmlFor="title">제목 <i>*</i></label>
            <div className={styles.controlWithMeta}>
              <input id="title" required maxLength={120} value={form.title} onChange={updateField("title")} placeholder="신고 주요 내용을 입력해 주세요" />
              <span>{form.title.length} / 120</span>
            </div>
          </div>

          <div className={`${styles.formRow} ${styles.alignTop}`}>
            <label htmlFor="content">신고 내용 <i>*</i></label>
            <div className={styles.controlWithMeta}>
              <textarea id="content" required rows={6} maxLength={5000} value={form.content} onChange={updateField("content")} placeholder="침해 내용과 발생 경위를 자세히 입력해 주세요" />
              <span>{form.content.length} / 5,000</span>
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.rowLabel}>게시 플랫폼 <i>*</i></span>
            <div id="platform" className={styles.selectControl}>
              <CustomSelect
                className={styles.customSelect}
                ariaLabel="게시 플랫폼"
                value={form.platform}
                onChange={updateSelect("platform")}
                placeholder="신고할 게시물이 업로드된 플랫폼을 선택해 주세요"
                options={platforms.map((platform) => ({ value: platform, label: platform }))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label htmlFor="postUrl">게시물 URL <i>*</i></label>
            <input id="postUrl" type="url" inputMode="url" required value={form.postUrl} onChange={updateField("postUrl")} placeholder="신고할 게시물의 URL을 입력해 주세요" />
          </div>

          <div className={styles.formRow}>
            <label htmlFor="postedAt">게시 일자 <i>*</i></label>
            <input id="postedAt" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.postedAt} onChange={updateField("postedAt")} />
          </div>

          <div className={styles.formRow}>
            <label htmlFor="authorName">게시물 작성자 <i>*</i></label>
            <input id="authorName" required maxLength={120} value={form.authorName} onChange={updateField("authorName")} placeholder="게시물 작성자의 ID 또는 닉네임을 입력해 주세요" />
          </div>

          <div className={styles.formRow}>
            <label htmlFor="postIp">게시물 IP 주소</label>
            <input id="postIp" maxLength={64} value={form.postIp} onChange={updateField("postIp")} placeholder="확인된 IP 주소가 있다면 입력해 주세요 (선택)" />
          </div>

          <div className={`${styles.formRow} ${styles.alignTop}`}>
            <span className={styles.rowLabel}>첨부 자료 <i>*</i></span>
            <div className={styles.fileUploadArea}>
              <label className={styles.uploadButton}>
                <LuUpload aria-hidden="true" />
                <span><b>파일 올리기</b><small>JPG, PNG, WEBP, GIF, PDF · 파일당 50MB 이하 · 최대 3개</small></span>
                <em>{files.length} / 3</em>
                <input id="evidenceFiles" type="file" multiple disabled={files.length >= 3} accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={addFiles} />
              </label>
              {files.length > 0 && <div className={styles.fileList}>
                {fileSlots.map((file, index) => file && (
                  <div className={styles.fileItem} key={`${file.name}-${file.lastModified}`}>
                    <span>{file.name}<small>{formatBytes(file.size)}</small></span>
                    <button type="button" onClick={() => removeFile(index)} aria-label={`${file.name} 삭제`}><LuTrash2 aria-hidden="true" /></button>
                  </div>
                ))}
              </div>}
            </div>
          </div>

          <p className={styles.guide}>캡처 날짜, 게시물 내용, URL, 작성자 정보가 보이도록 저장해 주세요.<br />내용이 길다면 순서를 알 수 있도록 여러 장으로 첨부해 주세요.</p>

          <label className={styles.confirm}>
            <input id="reportConfirmation" type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setError(""); setMissingFields([]); }} />
            <span><LuCheck aria-hidden="true" /></span>
            본 신고 내용이 허위나 조작 없이 사실에 근거해 작성되었음을 확인합니다.
          </label>

          {missingFields.length > 0 && (
            <div className={styles.validationSummary} role="alert">
              <b>입력하지 않은 항목</b>
              <p>{missingFields.join(" · ")}</p>
            </div>
          )}

          <p className={styles.submitHint}>내용을 확인한 뒤 등록 버튼을 1.5초 동안 길게 눌러주세요.</p>

          <button
            className={`${styles.submit} ${holdingSubmit ? styles.holding : ""}`}
            type="button"
            disabled={submitting}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.currentTarget.focus();
              startSubmitHold();
            }}
            onPointerUp={cancelSubmitHold}
            onPointerCancel={cancelSubmitHold}
            onPointerLeave={cancelSubmitHold}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                event.preventDefault();
                startSubmitHold();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                cancelSubmitHold();
              }
            }}
            onBlur={cancelSubmitHold}
            onContextMenu={(event) => event.preventDefault()}
          >
            {submitting ? "안전하게 전송하는 중…" : holdingSubmit ? "계속 누르세요…" : "1.5초 길게 눌러 등록"}
          </button>
        </form>}
        </div>
      </section>
    </main>
  );
}
