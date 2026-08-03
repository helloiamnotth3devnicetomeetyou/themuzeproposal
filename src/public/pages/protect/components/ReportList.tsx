"use client";

import { ArrowRight } from "lucide-react";
import { localeTags } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import type { Artist, MyReport } from "../ProtectClient";
import styles from "@/styles/(public)/pages/protect.module.css";

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
  const { locale, t } = useLocale();
  const legacyPlatformCodes: Record<string, string> = {
    Instagram: "instagram", "X (Twitter)": "x", YouTube: "youtube", TikTok: "tiktok",
    Facebook: "facebook", "커뮤니티·게시판": "community", 기타: "other",
  };
  const platformLabel = (value: string) => {
    const code = legacyPlatformCodes[value] ?? value;
    return t.protect.platforms.find((platform) => platform.value === code)?.label ?? value;
  };
  return (
    <section className={styles.myReports} aria-labelledby="my-reports-title">
      <div className={styles.listHeading}>
        <div>
          <h2 id="my-reports-title">{t.protect.myReports}</h2>
          <p>{t.protect.listDescription}</p>
        </div>
        <span>{t.protect.total(myReports.length)}</span>
      </div>

      {myReports.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t.protect.emptyTitle}</p>
          <span>{t.protect.emptyDescription}</span>
          <button type="button" onClick={onNavigateToReport}>
            {t.protect.report} <ArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className={styles.reportList}>
          {myReports.map((report) => (
            <article key={report.id} className={styles.reportItem}>
              <div className={styles.reportMain}>
                <span>
                  {artists.find((artist) => artist.id === report.artist_id)?.name || t.protect.artistFallback} ·{" "}
                  {reportTypes.find((type) => type.value === report.report_type)?.label || t.protect.reportTypes.at(-1)?.label}
                </span>
                <h3>{report.title}</h3>
                <p>
                  {platformLabel(report.platform)} · {t.protect.receipt} {report.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className={styles.reportStatus}>
                <span data-status={report.status}>{statusLabels[report.status]}</span>
                <time dateTime={report.created_at}>
                  {new Intl.DateTimeFormat(localeTags[locale], {
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
