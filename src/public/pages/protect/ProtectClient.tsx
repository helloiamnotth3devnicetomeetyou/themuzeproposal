"use client";

import { useState } from "react";
import { LuArrowRight, LuCircleAlert, LuFileCheck2, LuLockKeyhole } from "react-icons/lu";
import styles from "@/styles/(public)/pages/protect.module.css";
import ReportList from "./components/ReportList";
import ReportForm from "./components/ReportForm";

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

const reportTypes = [
  { value: "defamation", label: "명예훼손·허위사실" },
  { value: "harassment", label: "악성 댓글·비방" },
  { value: "impersonation", label: "사칭·계정 도용" },
  { value: "copyright", label: "저작권·콘텐츠 침해" },
  { value: "privacy", label: "개인정보 노출" },
  { value: "other", label: "기타" },
];

const statusLabels: Record<MyReport["status"], string> = {
  pending: "접수",
  reviewing: "검토 중",
  resolved: "처리 완료",
  rejected: "종결",
};

export default function ProtectClient({
  initialUserEmail,
  initialArtists,
  initialReports,
  initialLoadFailed = false,
}: {
  initialUserEmail: string;
  initialArtists: Artist[];
  initialReports: MyReport[];
  initialLoadFailed?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ProtectTab>("mine");
  const userEmail = initialUserEmail;
  const artists = initialArtists;
  const [myReports, setMyReports] = useState<MyReport[]>(initialReports);
  const [submittedId, setSubmittedId] = useState("");
  const [error, setError] = useState(
    initialLoadFailed ? "신고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : "",
  );

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
          <button
            type="button"
            onClick={() => { setSubmittedId(""); setActiveTab("mine"); }}
          >
            내 신고 보기 <LuArrowRight aria-hidden="true" />
          </button>
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
              <button
                type="button"
                className={activeTab === "mine" ? styles.activeTab : ""}
                onClick={() => { setActiveTab("mine"); setError(""); }}
              >
                내 신고
              </button>
              <button
                type="button"
                className={activeTab === "report" ? styles.activeTab : ""}
                onClick={() => { setActiveTab("report"); setError(""); }}
              >
                신고하기
              </button>
            </nav>
            <div>
              <LuLockKeyhole aria-hidden="true" />
              <span>비공개 접수</span>
              <b>{userEmail}</b>
            </div>
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
            <ReportList
              myReports={myReports}
              artists={artists}
              reportTypes={reportTypes}
              statusLabels={statusLabels}
              onNavigateToReport={() => setActiveTab("report")}
            />
          )}

          {activeTab === "report" && (
            <ReportForm
              artists={artists}
              userEmail={userEmail}
              setMyReports={setMyReports}
              setSubmittedId={setSubmittedId}
              setError={setError}
              error={error}
            />
          )}
        </div>
      </section>
    </main>
  );
}
