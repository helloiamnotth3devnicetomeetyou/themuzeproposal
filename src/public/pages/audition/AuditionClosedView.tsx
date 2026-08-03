"use client";

import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { AuditionStatus } from "@/admin/pages/auditions/audition-editor-model";
import styles from "@/styles/(public)/pages/audition.module.css";

type Props = {
  status: AuditionStatus | null; // null = no audition exists
  title?: string;
  endAt?: string | null;
};

const STATUS_MESSAGES: Record<
  AuditionStatus | "none",
  { headline: string; body: string }
> = {
  none:      { headline: "현재 진행 중인 오디션이 없습니다",    body: "다음 오디션 일정을 기다려주세요. 공지를 통해 새 오디션 정보를 안내드립니다." },
  tba:       { headline: "오디션 일정을 준비하고 있습니다",     body: "곧 상세 안내를 공개할 예정입니다. 공지 채널을 주목해주세요." },
  closed:    { headline: "오디션 접수가 마감되었습니다",        body: "이번 오디션 접수 기간이 종료되었습니다. 다음 기회를 기다려주세요." },
  reviewing: { headline: "현재 심사를 진행하고 있습니다",       body: "지원해주신 모든 분들께 감사드립니다. 결과 안내를 기다려주세요." },
  done:      { headline: "오디션 결과가 발표되었습니다",        body: "지원해주신 모든 분들께 진심으로 감사드립니다." },
  open:      { headline: "접수 기간이 종료되었습니다",          body: "오디션 접수 기간이 마감되었습니다." },
};

const formatKoDate = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export default function AuditionClosedView({ status, title, endAt }: Props) {
  const key = status ?? "none";
  const msg = STATUS_MESSAGES[key];

  return (
    <div className={styles.closedPage}>
      <div className={styles.closedInner}>
        <div className={styles.closedStatusChip} data-status={key}>
          {key === "none" || key === "tba" ? "COMING SOON" :
           key === "open" ? "CLOSED" :
           key === "closed" ? "CLOSED" :
           key === "reviewing" ? "REVIEWING" :
           "DONE"}
        </div>

        {title && <p className={styles.closedAuditionTitle}>{title}</p>}
        <h1 className={styles.closedHeadline}>{msg.headline}</h1>
        <p className={styles.closedBody}>{msg.body}</p>

        {endAt && (key === "closed" || key === "reviewing" || key === "done") && (
          <div className={styles.closedMeta}>
            <Calendar aria-hidden="true" />
            <span>접수 마감 <b>{formatKoDate(endAt)}</b></span>
          </div>
        )}

        <div className={styles.closedActions}>
          <Link href="/notice" className={styles.closedNoticeLink}>
            <Clock aria-hidden="true" />공지 확인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
