"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert } from "lucide-react";
import AccountProfileLink from "@/public/components/AccountProfileLink";
import CustomSelect from "@/core/components/form/CustomSelect";
import { campaignDescription, isCampaignOpen, type AuditionCampaign, type AuditionFormField, type AuditionSubmission } from "@/core/auditions/types";
import { localeTags } from "@/core/i18n/localized";
import { useLocale } from "@/core/providers/LocaleContext";
import protectStyles from "@/styles/(public)/pages/protect.module.css";
import styles from "@/styles/(public)/pages/audition.module.css";
import CampaignFormClient from "./CampaignFormClient";
import { auditionMessages } from "./messages";

type Tab = "mine" | "apply";

export default function AuditionClient({ userEmail, userName, avatarUrl, initialRemaining, initialCampaigns, initialFields, initialSubmissions, initialLoadFailed }: { userEmail: string; userName: string; avatarUrl: string; initialRemaining: number; initialCampaigns: AuditionCampaign[]; initialFields: AuditionFormField[]; initialSubmissions: AuditionSubmission[]; initialLoadFailed: boolean }) {
  const { locale } = useLocale();
  const m = auditionMessages[locale];
  const searchParams = useSearchParams();
  const openCampaigns = useMemo(() => initialCampaigns.filter((campaign) => isCampaignOpen(campaign)), [initialCampaigns]);
  const requestedCampaignId = searchParams.get("campaign");
  const initialCampaignId = openCampaigns.some((campaign) => campaign.id === requestedCampaignId) ? requestedCampaignId! : openCampaigns[0]?.id ?? "";
  const [activeTab, setActiveTab] = useState<Tab>(requestedCampaignId && initialCampaignId ? "apply" : "mine");
  const [campaignId, setCampaignId] = useState(initialCampaignId);
  const [editingId, setEditingId] = useState(() => initialSubmissions.find((submission) => submission.campaign_id === initialCampaignId)?.id ?? "");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState(initialLoadFailed ? m.loadError : "");
  const campaign = openCampaigns.find((item) => item.id === campaignId) ?? null;
  const editing = submissions.find((item) => item.id === editingId) ?? null;

  const openApply = (selectedCampaignId?: string, submissionId = "") => {
    const nextCampaignId = selectedCampaignId || openCampaigns[0]?.id || "";
    setCampaignId(nextCampaignId);
    setEditingId(submissionId || submissions.find((submission) => submission.campaign_id === nextCampaignId)?.id || "");
    setActiveTab("apply");
    setError("");
  };

  return <main className={protectStyles.page}><section className={protectStyles.shell}>
    <header className={protectStyles.header}><div className={protectStyles.headerSticky}>
      <h1>AUDITION</h1><p>{m.description}</p>
      <nav className={protectStyles.tabs} aria-label={m.menu}><button type="button" className={activeTab === "mine" ? protectStyles.activeTab : ""} onClick={() => { setActiveTab("mine"); setError(""); }}>{m.mine}</button><button type="button" className={activeTab === "apply" ? protectStyles.activeTab : ""} onClick={() => openApply()}>{m.apply}</button></nav>
      <AccountProfileLink name={userName} email={userEmail} avatarUrl={avatarUrl} remaining={remaining} />
    </div></header>
    <div className={protectStyles.contentColumn}>
      {error && <div className={protectStyles.error} role="alert"><CircleAlert aria-hidden="true" /><span>{error}</span><button type="button" onClick={() => setError("")} aria-label={m.closeError}>×</button></div>}
      {activeTab === "mine" && <section className={protectStyles.myReports} aria-labelledby="my-applications-title"><div className={protectStyles.listHeading}><div><h2 id="my-applications-title">{m.mine}</h2></div><span>{m.total(submissions.length)}</span></div>
        {!submissions.length ? <div className={protectStyles.emptyState}><p>{m.emptyTitle}</p><span>{m.emptyDescription}</span><button type="button" onClick={() => openApply()}>{m.apply} <ArrowRight aria-hidden="true" /></button></div> : <div className={protectStyles.reportList}>{submissions.map((submission) => { const itemCampaign = initialCampaigns.find((item) => item.id === submission.campaign_id); const primary = submission.form_snapshot.find((field) => field.is_primary_label); const editable = Boolean(itemCampaign && isCampaignOpen(itemCampaign)); return <article key={submission.id} className={protectStyles.reportItem}><div className={protectStyles.reportMain}><span>{itemCampaign?.title || m.campaignFallback}</span><h3>{primary ? String(submission.answers[primary.field_key] || m.applicationFallback) : m.applicationFallback}</h3><p>{m.receipt} {submission.id.slice(0, 8).toUpperCase()}</p></div><div className={protectStyles.reportStatus}><span data-status={submission.status}>{m.status[submission.status]}</span><time dateTime={submission.updated_at || submission.created_at}>{new Intl.DateTimeFormat(localeTags[locale], { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(submission.updated_at || submission.created_at))}</time>{editable && <button className={styles.editButton} type="button" onClick={() => openApply(submission.campaign_id, submission.id)}>{m.edit}</button>}</div></article>; })}</div>}
      </section>}
      {activeTab === "apply" && <section className={styles.applicationPanel}>
        <div className={`${protectStyles.formRow} ${styles.campaignPicker}`}><span className={protectStyles.rowLabel}>{m.campaign} <i>*</i></span><div className={protectStyles.selectControl}><CustomSelect className={protectStyles.customSelect} ariaLabel={m.campaign} value={campaignId} placeholder={m.selectCampaign} options={openCampaigns.map((item) => ({ value: item.id, label: item.title }))} onChange={(value) => { setCampaignId(value); setEditingId(submissions.find((submission) => submission.campaign_id === value)?.id ?? ""); }} /></div></div>
        {!campaign ? <div className={protectStyles.emptyState}><p>{m.noCampaign}</p><span>{m.noCampaignDescription}</span></div> : <><div className={styles.campaignIntro}><span className={styles.campaignStatus}>OPEN</span><h2>{campaign.title}</h2><p>{campaignDescription(campaign, locale)}</p>{campaign.starts_at && <time dateTime={campaign.starts_at}>{new Intl.DateTimeFormat(localeTags[locale], { dateStyle: "long" }).format(new Date(campaign.starts_at))} 시작</time>}{campaign.ends_at && <time dateTime={campaign.ends_at}>{m.deadline(new Intl.DateTimeFormat(localeTags[locale], { dateStyle: "long" }).format(new Date(campaign.ends_at)))}</time>}</div><CampaignFormClient key={`${campaign.id}-${editing?.id || "new"}`} campaign={campaign} fields={initialFields.filter((field) => field.campaign_id === campaign.id)} initialSubmission={editing?.campaign_id === campaign.id ? editing : null} userEmail={userEmail} onSaved={(submission, nextRemaining) => { setSubmissions((current) => [submission, ...current.filter((item) => item.id !== submission.id)]); setEditingId(submission.id); setRemaining(nextRemaining); }} onViewMine={() => setActiveTab("mine")} /></>}
      </section>}
    </div>
  </section></main>;
}
