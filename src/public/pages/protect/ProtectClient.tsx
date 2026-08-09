"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, FileCheck2 } from "lucide-react";
import AccountProfileLink from "@/public/components/AccountProfileLink";
import { localizeText } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import styles from "@/styles/(public)/pages/protect.module.css";
import ReportList from "./components/ReportList";
import ReportForm from "./components/ReportForm";

export type Artist = { id: string; name: string; eng_name?: string | null; name_ko?: string | null; name_en?: string | null; name_ja?: string | null };
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

export default function ProtectClient({
  initialUserEmail,
  initialUserName,
  initialAvatarUrl,
  initialRemaining,
  initialArtists,
  initialReports,
  initialLoadFailed = false,
}: {
  initialUserEmail: string;
  initialUserName: string;
  initialAvatarUrl: string;
  initialRemaining: number;
  initialArtists: Artist[];
  initialReports: MyReport[];
  initialLoadFailed?: boolean;
}) {
  const { locale, t } = useLocale();
  const [activeTab, setActiveTab] = useState<ProtectTab>("mine");
  const userEmail = initialUserEmail;
  const artists = initialArtists.map((artist) => ({
    ...artist,
    name: localizeText({ ko: artist.name_ko ?? artist.name, en: artist.name_en ?? artist.eng_name, ja: artist.name_ja }, locale, artist.name),
  }));
  const [myReports, setMyReports] = useState<MyReport[]>(initialReports);
  const [submittedId, setSubmittedId] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState(
    initialLoadFailed ? t.protect.loadError : "",
  );

  if (submittedId) {
    return (
      <main className={styles.page}>
        <section className={styles.success} aria-labelledby="success-title">
          <FileCheck2 aria-hidden="true" />
          <p>{t.protect.receivedEyebrow}</p>
          <h1 id="success-title">{t.protect.receivedTitle}</h1>
          <span>{t.protect.receivedDescription}</span>
          <dl>
            <div><dt>{t.protect.receiptNumber}</dt><dd>{submittedId.slice(0, 8).toUpperCase()}</dd></div>
            <div><dt>{t.protect.processingStatus}</dt><dd>{t.protect.receivedStatus}</dd></div>
          </dl>
          <button
            type="button"
            onClick={() => { setSubmittedId(""); setActiveTab("mine"); }}
          >
            {t.protect.viewReports} <ArrowRight aria-hidden="true" />
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
            <p>{t.protect.description}</p>
            <nav className={styles.tabs} aria-label={t.protect.description}>
              <button
                type="button"
                className={activeTab === "mine" ? styles.activeTab : ""}
                onClick={() => { setActiveTab("mine"); setError(""); }}
              >
                {t.protect.myReports}
              </button>
              <button
                type="button"
                className={activeTab === "report" ? styles.activeTab : ""}
                onClick={() => { setActiveTab("report"); setError(""); }}
              >
                {t.protect.report}
              </button>
            </nav>
            <AccountProfileLink name={initialUserName} email={userEmail} avatarUrl={initialAvatarUrl} remaining={remaining} />
          </div>
        </header>

        <div className={styles.contentColumn}>
          {error && (
            <div className={styles.error} role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label={t.protect.closeError}>×</button>
            </div>
          )}

          {activeTab === "mine" && (
            <ReportList
              myReports={myReports}
              artists={artists}
              reportTypes={t.protect.reportTypes}
              statusLabels={t.protect.status}
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
              setRemaining={setRemaining}
              error={error}
            />
          )}
        </div>
      </section>
    </main>
  );
}
