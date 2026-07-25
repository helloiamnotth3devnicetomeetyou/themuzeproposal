"use client";

import { LuArrowRight } from "react-icons/lu";
import type { Artist, MyReport } from "../ProtectClient";
import styles from "../protect.module.css";

type ReportListProps = {
  myReports: MyReport[];
  artists: Artist[];
  reportTypes: Array<{ value: string; label: string }>;
  statusLabels: Record<string, string>;
  onNavigateToReport: () => void;
};

export default function ReportList({
  myReports,
  artists,
  reportTypes,
  statusLabels,
  onNavigateToReport,
}: ReportListProps) {
  return (
    <section className={styles.myReports} aria-labelledby="my-reports-title">
      <div className={styles.listHeading}>
        <div>
          <h2 id="my-reports-title">내 신고</h2>
          <p>접수한 신고와 현재 처리 상태를 확인할 수 있습니다.</p>
        </div>
        <span>총 {myReports.length}건</span>
      </div>

      {myReports.length === 0 ? (
        <div className={styles.emptyState}>
          <p>아직 접수한 신고가 없습니다.</p>
          <span>권익 침해 사례를 발견했다면 내용을 알려주세요.</span>
          <button type="button" onClick={onNavigateToReport}>
            신고하기 <LuArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className={styles.reportList}>
          {myReports.map((report) => (
            <article key={report.id} className={styles.reportItem}>
              <div className={styles.reportMain}>
                <span>
                  {artists.find((artist) => artist.id === report.artist_id)?.name || "아티스트"} ·{" "}
                  {reportTypes.find((type) => type.value === report.report_type)?.label || "기타"}
                </span>
                <h3>{report.title}</h3>
                <p>
                  {report.platform} · 접수번호 {report.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className={styles.reportStatus}>
                <span data-status={report.status}>{statusLabels[report.status]}</span>
                <time dateTime={report.created_at}>
                  {new Intl.DateTimeFormat("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date(report.created_at))}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
